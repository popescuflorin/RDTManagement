using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProductionManagement.API.Authorization;
using ProductionManagement.API.Data;
using ProductionManagement.API.Models;
using ProductionManagement.API.Repositories;
using System.Security.Claims;

namespace ProductionManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrderController : ControllerBase
    {
        private readonly IOrderRepository _orderRepository;
        private readonly IRawMaterialRepository _rawMaterialRepository;
        private readonly ITransportRepository _transportRepository;
        private readonly IClientRepository _clientRepository;
        private readonly ApplicationDbContext _context;

        public OrderController(
            IOrderRepository orderRepository,
            IRawMaterialRepository rawMaterialRepository,
            ITransportRepository transportRepository,
            IClientRepository clientRepository,
            ApplicationDbContext context)
        {
            _orderRepository = orderRepository;
            _rawMaterialRepository = rawMaterialRepository;
            _transportRepository = transportRepository;
            _clientRepository = clientRepository;
            _context = context;
        }

        [HttpGet]
        [RequirePermission(Permissions.ViewOrdersTab)]
        public async Task<ActionResult<IEnumerable<OrderInfo>>> GetOrders()
        {
            var orders = await _orderRepository.GetActiveOrdersAsync();
            var orderInfos = orders.Select(MapToOrderInfo).ToList();
            return Ok(orderInfos);
        }

        [HttpGet("{id}")]
        [RequirePermission(Permissions.ViewOrder)]
        public async Task<ActionResult<OrderInfo>> GetOrder(int id)
        {
            var order = await _orderRepository.GetByIdWithMaterialsAsync(id);
            if (order == null)
            {
                return NotFound();
            }
            return Ok(MapToOrderInfo(order));
        }

        [HttpPost]
        [RequirePermission(Permissions.CreateOrder)]
        public async Task<ActionResult<OrderInfo>> CreateOrder([FromBody] CreateOrderRequest request)
        {
            var usernameClaim = User.FindFirst(ClaimTypes.Name)?.Value;
            if (string.IsNullOrEmpty(usernameClaim))
            {
                return Unauthorized("Invalid user");
            }

            // Validate that all materials are Finished Products
            foreach (var orderMaterial in request.OrderMaterials)
            {
                var material = await _rawMaterialRepository.GetByIdAsync(orderMaterial.RawMaterialId);
                if (material == null)
                {
                    return BadRequest(new { message = $"Material with ID {orderMaterial.RawMaterialId} not found" });
                }
                if (material.Type != MaterialType.FinishedProduct)
                {
                    return BadRequest(new { message = $"Material '{material.Name}' is not a Finished Product. Only Finished Products can be added to orders." });
                }
                if (!material.IsActive)
                {
                    return BadRequest(new { message = $"Material '{material.Name}' is not active" });
                }
                // Note: We allow ordering more than available quantity for future fulfillment
                // The inventory "Requested Quantity" feature will track over-commitments
                // Availability check happens when processing the order
            }

            // Validate client
            var client = await _clientRepository.GetByIdAsync(request.ClientId);
            if (client == null || !client.IsActive)
            {
                return BadRequest(new { message = "Client not found or not active" });
            }

            // Validate transport if provided
            if (request.TransportId.HasValue)
            {
                var transport = await _transportRepository.GetByIdAsync(request.TransportId.Value);
                if (transport == null)
                {
                    return BadRequest(new { message = "Transport not found" });
                }
                if (!transport.IsActive)
                {
                    return BadRequest(new { message = "Transport is not active" });
                }
            }

            var order = new Order
            {
                ClientId = request.ClientId,
                Description = request.Description,
                Notes = request.Notes,
                Status = OrderStatus.Draft,
                OrderDate = request.OrderDate,
                ExpectedDeliveryDate = request.ExpectedDeliveryDate,
                TransportId = request.TransportId,
                TransportDate = request.TransportDate,
                TransportNotes = request.TransportNotes,
                CreatedByUserName = usernameClaim,
                CreatedAt = DateTime.UtcNow
            };

            // Calculate total value and add order materials
            decimal totalValue = 0;
            foreach (var orderMaterialRequest in request.OrderMaterials)
            {
                var material = await _rawMaterialRepository.GetByIdAsync(orderMaterialRequest.RawMaterialId);
                if (material == null) continue;

                // Use UnitCost as UnitPrice (in a real system, you might have a separate selling price)
                decimal unitPrice = material.UnitCost > 0 ? material.UnitCost : 0;
                decimal materialTotal = unitPrice * orderMaterialRequest.Quantity;
                totalValue += materialTotal;

                var orderMaterial = new OrderMaterial
                {
                    OrderId = order.Id,
                    RawMaterialId = orderMaterialRequest.RawMaterialId,
                    Quantity = orderMaterialRequest.Quantity,
                    MaterialName = material.Name,
                    MaterialColor = material.Color,
                    QuantityType = material.QuantityType,
                    UnitPrice = unitPrice,
                    CreatedAt = DateTime.UtcNow
                };
                order.OrderMaterials.Add(orderMaterial);
            }

            var createdOrder = await _orderRepository.AddAsync(order);
            await _context.SaveChangesAsync();

            // Reload with materials
            var orderWithMaterials = await _orderRepository.GetByIdWithMaterialsAsync(createdOrder.Id);
            return Ok(MapToOrderInfo(orderWithMaterials!));
        }

        [HttpPut("{id}")]
        [RequirePermission(Permissions.EditOrder)]
        public async Task<ActionResult<OrderInfo>> UpdateOrder(int id, [FromBody] UpdateOrderRequest request)
        {
            var order = await _orderRepository.GetByIdWithMaterialsAsync(id);
            if (order == null)
            {
                return NotFound();
            }

            // Can only edit draft orders
            if (order.Status != OrderStatus.Draft)
            {
                return BadRequest(new { message = "Only draft orders can be edited" });
            }

            // Update client if provided
            if (request.ClientId.HasValue)
            {
                var client = await _clientRepository.GetByIdAsync(request.ClientId.Value);
                if (client == null || !client.IsActive)
                {
                    return BadRequest(new { message = "Client not found or not active" });
                }
                order.ClientId = request.ClientId.Value;
            }

            if (request.Description != null) order.Description = request.Description;
            if (request.Notes != null) order.Notes = request.Notes;
            if (request.OrderDate.HasValue) order.OrderDate = request.OrderDate.Value;
            if (request.ExpectedDeliveryDate.HasValue) order.ExpectedDeliveryDate = request.ExpectedDeliveryDate;
            if (request.TransportDate.HasValue) order.TransportDate = request.TransportDate;
            if (request.TransportNotes != null) order.TransportNotes = request.TransportNotes;

            // Update transport
            if (request.TransportId.HasValue)
            {
                var transport = await _transportRepository.GetByIdAsync(request.TransportId.Value);
                if (transport == null)
                {
                    return BadRequest(new { message = "Transport not found" });
                }
                if (!transport.IsActive)
                {
                    return BadRequest(new { message = "Transport is not active" });
                }
                order.TransportId = request.TransportId.Value;
            }

            // Update status
            if (request.Status.HasValue)
            {
                order.Status = request.Status.Value;
                if (request.Status.Value == OrderStatus.Delivered && order.DeliveryDate == null)
                {
                    order.DeliveryDate = DateTime.UtcNow;
                }
            }

            // Update materials if provided
            if (request.OrderMaterials != null)
            {
                // Validate materials
                foreach (var orderMaterialRequest in request.OrderMaterials)
                {
                    var material = await _rawMaterialRepository.GetByIdAsync(orderMaterialRequest.RawMaterialId);
                    if (material == null)
                    {
                        return BadRequest(new { message = $"Material with ID {orderMaterialRequest.RawMaterialId} not found" });
                    }
                    if (material.Type != MaterialType.FinishedProduct)
                    {
                        return BadRequest(new { message = $"Material '{material.Name}' is not a Finished Product" });
                    }
                    if (!material.IsActive)
                    {
                        return BadRequest(new { message = $"Material '{material.Name}' is not active" });
                    }
                }

                // Remove existing materials
                _context.OrderMaterials.RemoveRange(order.OrderMaterials);

                // Add new materials
                foreach (var orderMaterialRequest in request.OrderMaterials)
                {
                    var material = await _rawMaterialRepository.GetByIdAsync(orderMaterialRequest.RawMaterialId);
                    if (material == null) continue;

                    decimal unitPrice = material.UnitCost > 0 ? material.UnitCost : 0;
                    var orderMaterial = new OrderMaterial
                    {
                        OrderId = order.Id,
                        RawMaterialId = orderMaterialRequest.RawMaterialId,
                        Quantity = orderMaterialRequest.Quantity,
                        MaterialName = material.Name,
                        MaterialColor = material.Color,
                        QuantityType = material.QuantityType,
                        UnitPrice = unitPrice,
                        CreatedAt = DateTime.UtcNow
                    };
                    order.OrderMaterials.Add(orderMaterial);
                }
            }

            order.UpdatedAt = DateTime.UtcNow;
            await _orderRepository.UpdateAsync(order);
            await _context.SaveChangesAsync();

            var updatedOrder = await _orderRepository.GetByIdWithMaterialsAsync(id);
            return Ok(MapToOrderInfo(updatedOrder!));
        }

        [HttpPost("{id}/process")]
        [RequirePermission(Permissions.ProcessOrder)]
        public async Task<ActionResult<OrderInfo>> ProcessOrder(int id)
        {
            var order = await _orderRepository.GetByIdWithMaterialsAsync(id);
            if (order == null)
            {
                return NotFound(new { message = "Order not found" });
            }

            // Can only process draft or pending orders
            if (order.Status != OrderStatus.Draft && order.Status != OrderStatus.Pending)
            {
                return BadRequest(new { message = "Can only process draft or pending orders" });
            }

            // Check inventory availability and subtract products
            foreach (var orderMaterial in order.OrderMaterials)
            {
                var material = await _rawMaterialRepository.GetByIdAsync(orderMaterial.RawMaterialId);
                if (material == null)
                {
                    return BadRequest(new { message = $"Product not found: {orderMaterial.MaterialName}" });
                }

                if (!material.IsActive)
                {
                    return BadRequest(new { message = $"Product is not active: {orderMaterial.MaterialName}" });
                }

                // Check if sufficient quantity available
                if (material.Quantity < orderMaterial.Quantity)
                {
                    return BadRequest(new { 
                        message = $"Insufficient quantity for {orderMaterial.MaterialName} ({orderMaterial.MaterialColor}). Required: {orderMaterial.Quantity} {orderMaterial.QuantityType}, Available: {material.Quantity} {orderMaterial.QuantityType}" 
                    });
                }

                // Subtract quantity from inventory
                material.Quantity -= orderMaterial.Quantity;
                material.UpdatedAt = DateTime.UtcNow;
                await _rawMaterialRepository.UpdateAsync(material);
            }

            // Update order status to Processing
            order.Status = OrderStatus.Processing;
            order.UpdatedAt = DateTime.UtcNow;
            await _orderRepository.UpdateAsync(order);
            await _context.SaveChangesAsync();

            var orderInfo = await _orderRepository.GetByIdWithMaterialsAsync(id);
            return Ok(MapToOrderInfo(orderInfo!));
        }

        [HttpPost("{id}/cancel")]
        [RequirePermission(Permissions.CancelOrder)]
        public async Task<ActionResult<OrderInfo>> CancelOrder(int id)
        {
            var order = await _orderRepository.GetByIdWithMaterialsAsync(id);
            if (order == null)
            {
                return NotFound(new { message = "Order not found" });
            }

            if (order.Status == OrderStatus.Delivered)
            {
                return BadRequest(new { message = "Cannot cancel delivered order" });
            }

            if (order.Status == OrderStatus.Cancelled)
            {
                return BadRequest(new { message = "Order is already cancelled" });
            }

            order.Status = OrderStatus.Cancelled;
            order.UpdatedAt = DateTime.UtcNow;
            await _orderRepository.UpdateAsync(order);
            await _context.SaveChangesAsync();

            var orderInfo = await _orderRepository.GetByIdWithMaterialsAsync(id);
            return Ok(MapToOrderInfo(orderInfo!));
        }

        [HttpDelete("{id}")]
        [RequirePermission(Permissions.CancelOrder)]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var order = await _orderRepository.GetByIdAsync(id);
            if (order == null)
            {
                return NotFound();
            }

            // Can only delete draft orders
            if (order.Status != OrderStatus.Draft)
            {
                return BadRequest(new { message = "Only draft orders can be deleted" });
            }

            await _orderRepository.DeleteAsync(order);
            return NoContent();
        }

        [HttpGet("statistics")]
        [RequirePermission(Permissions.ViewOrdersTab)]
        public async Task<ActionResult<OrderStatistics>> GetStatistics()
        {
            var orders = await _orderRepository.GetOrdersWithMaterialsAsync();
            var orderList = orders.ToList();

            var statistics = new OrderStatistics
            {
                TotalOrders = orderList.Count,
                DraftOrders = orderList.Count(o => o.Status == OrderStatus.Draft),
                PendingOrders = orderList.Count(o => o.Status == OrderStatus.Pending),
                ProcessingOrders = orderList.Count(o => o.Status == OrderStatus.Processing),
                ShippedOrders = orderList.Count(o => o.Status == OrderStatus.Shipped),
                DeliveredOrders = orderList.Count(o => o.Status == OrderStatus.Delivered),
                TotalOrderValue = orderList.Sum(o => o.OrderMaterials.Sum(om => om.Quantity * om.UnitPrice))
            };

            return Ok(statistics);
        }

        private OrderInfo MapToOrderInfo(Order order)
        {
            var statusLabel = order.Status switch
            {
                OrderStatus.Draft => "Draft",
                OrderStatus.Pending => "Pending",
                OrderStatus.Processing => "Processing",
                OrderStatus.Shipped => "Shipped",
                OrderStatus.Delivered => "Delivered",
                OrderStatus.Cancelled => "Cancelled",
                _ => "Unknown"
            };

            return new OrderInfo
            {
                Id = order.Id,
                ClientId = order.ClientId,
                ClientName = order.Client?.Name ?? string.Empty,
                ClientContactPerson = order.Client?.ContactPerson,
                ClientEmail = order.Client?.Email,
                ClientPhone = order.Client?.Phone,
                ClientAddress = order.Client?.Address,
                ClientCity = order.Client?.City,
                ClientPostalCode = order.Client?.PostalCode,
                ClientCountry = order.Client?.Country,
                Description = order.Description,
                Notes = order.Notes,
                Status = order.Status,
                StatusLabel = statusLabel,
                OrderDate = order.OrderDate,
                ExpectedDeliveryDate = order.ExpectedDeliveryDate,
                DeliveryDate = order.DeliveryDate,
                TransportId = order.TransportId,
                TransportCarName = order.Transport?.CarName,
                TransportPhoneNumber = order.Transport?.PhoneNumber,
                TransportDate = order.TransportDate,
                TransportNotes = order.TransportNotes,
                CreatedByUserName = order.CreatedByUserName,
                CreatedAt = order.CreatedAt,
                UpdatedAt = order.UpdatedAt,
                OrderMaterials = order.OrderMaterials.Select(om => new OrderMaterialInfo
                {
                    Id = om.Id,
                    OrderId = om.OrderId,
                    RawMaterialId = om.RawMaterialId,
                    MaterialName = om.MaterialName,
                    MaterialColor = om.MaterialColor,
                    QuantityType = om.QuantityType,
                    Quantity = om.Quantity,
                    UnitPrice = om.UnitPrice,
                    TotalPrice = om.Quantity * om.UnitPrice
                }).ToList(),
                TotalValue = order.OrderMaterials.Sum(om => om.Quantity * om.UnitPrice)
            };
        }
    }
}


using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProductionManagement.API.Models;
using System.Security.Claims;

namespace ProductionManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AcquisitionController : ControllerBase
    {
        // In-memory storage for demo purposes
        private static List<Acquisition> _acquisitions = new List<Acquisition>();
        private static int _nextAcquisitionId = 1;
        private static int _nextAcquisitionItemId = 1;

        [HttpGet]
        [Authorize(Roles = "Admin,Manager,User")]
        public async Task<ActionResult<IEnumerable<AcquisitionDto>>> GetAcquisitions()
        {
            var acquisitions = _acquisitions
                .Where(a => a.IsActive)
                .OrderByDescending(a => a.CreatedAt)
                .Select(MapToDto)
                .ToList();

            return await Task.FromResult(Ok(acquisitions));
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Manager,User")]
        public async Task<ActionResult<AcquisitionDto>> GetAcquisition(int id)
        {
            var acquisition = _acquisitions
                .FirstOrDefault(a => a.Id == id && a.IsActive);

            if (acquisition == null)
            {
                return NotFound();
            }

            return await Task.FromResult(Ok(MapToDto(acquisition)));
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<AcquisitionDto>> CreateAcquisition(CreateAcquisitionRequest request)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized("Invalid user ID");
            }

            // Get user info from UserController's static list
            var user = UserController.GetUserById(userId);
            if (user == null)
            {
                return Unauthorized("User not found");
            }

            // Get supplier name if supplier is selected
            string? supplierName = null;
            if (request.SupplierId.HasValue)
            {
                var supplier = SupplierController.GetSupplierById(request.SupplierId.Value);
                supplierName = supplier?.Name;
            }

            var acquisition = new Acquisition
            {
                Id = _nextAcquisitionId++,
                Title = request.Title,
                Description = request.Description,
                Type = request.Type,
                Status = AcquisitionStatus.Draft,
                CreatedByUserId = userId,
                SupplierId = request.SupplierId,
                SupplierName = supplierName,
                SupplierContact = request.SupplierContact,
                Notes = request.Notes,
                DueDate = request.DueDate,
                TransportCarName = request.TransportCarName,
                TransportPhoneNumber = request.TransportPhoneNumber,
                TransportDate = request.TransportDate,
                TransportNotes = request.TransportNotes,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            // Add items
            foreach (var itemRequest in request.Items)
            {
                int rawMaterialId = itemRequest.RawMaterialId;
                
                // If RawMaterialId is 0, create a new raw material
                if (rawMaterialId == 0)
                {
                    var newRawMaterial = new RawMaterial
                    {
                        Id = InventoryController.GetNextRawMaterialId(),
                        Name = itemRequest.Name,
                        Color = itemRequest.Color,
                        Quantity = 0, // Start with 0 quantity, will be updated when received
                        QuantityType = itemRequest.QuantityType,
                        UnitCost = 0, // Will be updated when received with actual cost
                        Description = itemRequest.Description ?? string.Empty,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        IsActive = true
                    };
                    
                    // Add the new raw material to inventory
                    InventoryController.AddRawMaterial(newRawMaterial);
                    rawMaterialId = newRawMaterial.Id;
                }
                else
                {
                    // Verify existing raw material exists
                    var existingRawMaterial = InventoryController.GetRawMaterialById(rawMaterialId);
                    if (existingRawMaterial == null)
                    {
                        return BadRequest($"Raw material with ID {rawMaterialId} not found");
                    }
                }

                var item = new AcquisitionItem
                {
                    Id = _nextAcquisitionItemId++,
                    AcquisitionId = acquisition.Id,
                    RawMaterialId = rawMaterialId,
                    Name = itemRequest.Name,
                    Color = itemRequest.Color,
                    Quantity = itemRequest.Quantity,
                    QuantityType = itemRequest.QuantityType,
                    Notes = itemRequest.Notes,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                acquisition.Items.Add(item);
            }

            // Calculate total estimated cost (always 0 for materials)
            acquisition.TotalEstimatedCost = 0;

            _acquisitions.Add(acquisition);

            return await Task.FromResult(CreatedAtAction(nameof(GetAcquisition), new { id = acquisition.Id }, MapToDto(acquisition)));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<AcquisitionDto>> UpdateAcquisition(int id, UpdateAcquisitionRequest request)
        {
            var acquisition = _acquisitions
                .FirstOrDefault(a => a.Id == id && a.IsActive);

            if (acquisition == null)
            {
                return NotFound();
            }

            if (acquisition.Status != AcquisitionStatus.Draft)
            {
                return BadRequest("Only draft acquisitions can be edited");
            }

            // Get supplier name if supplier is selected
            string? supplierName = null;
            if (request.SupplierId.HasValue)
            {
                var supplier = SupplierController.GetSupplierById(request.SupplierId.Value);
                supplierName = supplier?.Name;
            }

            acquisition.Title = request.Title;
            acquisition.Description = request.Description;
            acquisition.SupplierId = request.SupplierId;
            acquisition.SupplierName = supplierName;
            acquisition.SupplierContact = request.SupplierContact;
            acquisition.Notes = request.Notes;
            acquisition.DueDate = request.DueDate;
            acquisition.TransportCarName = request.TransportCarName;
            acquisition.TransportPhoneNumber = request.TransportPhoneNumber;
            acquisition.TransportDate = request.TransportDate;
            acquisition.TransportNotes = request.TransportNotes;
            acquisition.UpdatedAt = DateTime.UtcNow;

            // Update items
            var existingItemIds = request.Items.Where(i => i.Id.HasValue).Select(i => i.Id!.Value).ToList();
            
            // Remove items not in the request
            var itemsToRemove = acquisition.Items.Where(i => !existingItemIds.Contains(i.Id)).ToList();
            foreach (var item in itemsToRemove)
            {
                item.IsActive = false;
            }

            // Update existing items and add new ones
            foreach (var itemRequest in request.Items)
            {
                int rawMaterialId = itemRequest.RawMaterialId;
                
                // If RawMaterialId is 0, create a new raw material
                if (rawMaterialId == 0)
                {
                    var newRawMaterial = new RawMaterial
                    {
                        Id = InventoryController.GetNextRawMaterialId(),
                        Name = itemRequest.Name,
                        Color = itemRequest.Color,
                        Quantity = 0, // Start with 0 quantity, will be updated when received
                        QuantityType = itemRequest.QuantityType,
                        UnitCost = 0, // Will be updated when received with actual cost
                        Description = itemRequest.Description ?? string.Empty,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        IsActive = true
                    };
                    
                    // Add the new raw material to inventory
                    InventoryController.AddRawMaterial(newRawMaterial);
                    rawMaterialId = newRawMaterial.Id;
                }
                else
                {
                    // Verify existing raw material exists
                    var existingRawMaterial = InventoryController.GetRawMaterialById(rawMaterialId);
                    if (existingRawMaterial == null)
                    {
                        return BadRequest($"Raw material with ID {rawMaterialId} not found");
                    }
                }

                if (itemRequest.Id.HasValue)
                {
                    // Update existing item
                    var existingItem = acquisition.Items.FirstOrDefault(i => i.Id == itemRequest.Id.Value);
                    if (existingItem != null)
                    {
                        existingItem.RawMaterialId = rawMaterialId;
                        existingItem.Name = itemRequest.Name;
                        existingItem.Color = itemRequest.Color;
                        existingItem.Quantity = itemRequest.Quantity;
                        existingItem.QuantityType = itemRequest.QuantityType;
                        existingItem.Notes = itemRequest.Notes;
                        existingItem.UpdatedAt = DateTime.UtcNow;
                    }
                }
                else
                {
                    // Add new item
                    var newItem = new AcquisitionItem
                    {
                        Id = _nextAcquisitionItemId++,
                        AcquisitionId = acquisition.Id,
                        RawMaterialId = rawMaterialId,
                        Name = itemRequest.Name,
                        Color = itemRequest.Color,
                        Quantity = itemRequest.Quantity,
                        QuantityType = itemRequest.QuantityType,
                        Notes = itemRequest.Notes,
                        CreatedAt = DateTime.UtcNow,
                        IsActive = true
                    };
                    acquisition.Items.Add(newItem);
                }
            }

            // Calculate total estimated cost (always 0 for materials)
            acquisition.TotalEstimatedCost = 0;

            return await Task.FromResult(Ok(MapToDto(acquisition)));
        }

        [HttpPost("{id}/receive")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<AcquisitionDto>> ReceiveAcquisition(int id, ReceiveAcquisitionRequest request)
        {
            var acquisition = _acquisitions
                .FirstOrDefault(a => a.Id == id && a.IsActive);

            if (acquisition == null)
            {
                return NotFound();
            }

            if (acquisition.Status != AcquisitionStatus.Draft)
            {
                return BadRequest("Only draft acquisitions can be received");
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized("Invalid user ID");
            }

            // Update items with actual costs and add to inventory
            foreach (var itemRequest in request.Items)
            {
                var acquisitionItem = acquisition.Items.FirstOrDefault(i => i.Id == itemRequest.AcquisitionItemId);
                if (acquisitionItem == null)
                {
                    return BadRequest($"Acquisition item with ID {itemRequest.AcquisitionItemId} not found");
                }

                acquisitionItem.ActualUnitCost = itemRequest.ActualUnitCost;
                acquisitionItem.UpdatedAt = DateTime.UtcNow;

                // Add to inventory
                var rawMaterial = InventoryController.GetRawMaterialById(acquisitionItem.RawMaterialId);
                if (rawMaterial != null)
                {
                    rawMaterial.Quantity += acquisitionItem.Quantity;
                    rawMaterial.UpdatedAt = DateTime.UtcNow;

                    // Update unit cost using weighted average
                    if (acquisitionItem.ActualUnitCost.HasValue)
                    {
                        var currentTotalValue = rawMaterial.Quantity * rawMaterial.UnitCost;
                        var newTotalValue = currentTotalValue + (acquisitionItem.Quantity * acquisitionItem.ActualUnitCost.Value);
                        var newTotalQuantity = rawMaterial.Quantity;
                        
                        if (newTotalQuantity > 0)
                        {
                            rawMaterial.UnitCost = newTotalValue / newTotalQuantity;
                        }
                    }
                }
            }

            // Update acquisition status
            acquisition.Status = AcquisitionStatus.Received;
            acquisition.ReceivedAt = DateTime.UtcNow;
            acquisition.ReceivedByUserId = userId;
            acquisition.TotalActualCost = acquisition.Items.Sum(i => i.ActualTotalCost);

            return await Task.FromResult(Ok(MapToDto(acquisition)));
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> DeleteAcquisition(int id)
        {
            var acquisition = _acquisitions
                .FirstOrDefault(a => a.Id == id && a.IsActive);

            if (acquisition == null)
            {
                return NotFound();
            }

            if (acquisition.Status != AcquisitionStatus.Draft)
            {
                return BadRequest("Only draft acquisitions can be deleted");
            }

            acquisition.IsActive = false;
            acquisition.UpdatedAt = DateTime.UtcNow;

            return await Task.FromResult(NoContent());
        }

        [HttpGet("statistics")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<AcquisitionStatistics>> GetStatistics()
        {
            var statistics = new AcquisitionStatistics
            {
                TotalAcquisitions = _acquisitions.Count(a => a.IsActive),
                DraftAcquisitions = _acquisitions.Count(a => a.IsActive && a.Status == AcquisitionStatus.Draft),
                ReceivedAcquisitions = _acquisitions.Count(a => a.IsActive && a.Status == AcquisitionStatus.Received),
                CancelledAcquisitions = _acquisitions.Count(a => a.IsActive && a.Status == AcquisitionStatus.Cancelled),
                TotalEstimatedCost = _acquisitions.Where(a => a.IsActive).Sum(a => a.TotalEstimatedCost),
                TotalActualCost = _acquisitions.Where(a => a.IsActive).Sum(a => a.TotalActualCost),
                TotalItems = _acquisitions.Where(a => a.IsActive).Sum(a => a.Items.Count),
                TotalQuantity = _acquisitions.Where(a => a.IsActive).Sum(a => a.Items.Sum(i => (int)i.Quantity))
            };

            return await Task.FromResult(Ok(statistics));
        }

        private AcquisitionDto MapToDto(Acquisition acquisition)
        {
            var createdByUser = UserController.GetUserById(acquisition.CreatedByUserId);
            var receivedByUser = acquisition.ReceivedByUserId.HasValue 
                ? UserController.GetUserById(acquisition.ReceivedByUserId.Value) 
                : null;

            return new AcquisitionDto
            {
                Id = acquisition.Id,
                Title = acquisition.Title,
                Description = acquisition.Description,
                Type = acquisition.Type,
                Status = acquisition.Status,
                CreatedAt = acquisition.CreatedAt,
                UpdatedAt = acquisition.UpdatedAt,
                ReceivedAt = acquisition.ReceivedAt,
                CreatedByUserId = acquisition.CreatedByUserId,
                CreatedByUserName = createdByUser != null ? $"{createdByUser.FirstName} {createdByUser.LastName}" : "Unknown",
                ReceivedByUserId = acquisition.ReceivedByUserId,
                ReceivedByUserName = receivedByUser != null ? $"{receivedByUser.FirstName} {receivedByUser.LastName}" : null,
                SupplierId = acquisition.SupplierId,
                SupplierName = acquisition.SupplierName,
                SupplierContact = acquisition.SupplierContact,
                Notes = acquisition.Notes,
                DueDate = acquisition.DueDate,
                TransportCarName = acquisition.TransportCarName,
                TransportPhoneNumber = acquisition.TransportPhoneNumber,
                TransportDate = acquisition.TransportDate,
                TransportNotes = acquisition.TransportNotes,
                TotalEstimatedCost = acquisition.TotalEstimatedCost,
                TotalActualCost = acquisition.TotalActualCost,
                TotalItems = acquisition.Items.Count,
                TotalQuantity = acquisition.Items.Sum(i => (int)i.Quantity),
                CanEdit = acquisition.Status == AcquisitionStatus.Draft,
                CanDelete = acquisition.Status == AcquisitionStatus.Draft,
                CanReceive = acquisition.Status == AcquisitionStatus.Draft,
                Items = acquisition.Items.Select(MapItemToDto).ToList()
            };
        }

        private AcquisitionItemDto MapItemToDto(AcquisitionItem item)
        {
            var rawMaterial = InventoryController.GetRawMaterialById(item.RawMaterialId);

            return new AcquisitionItemDto
            {
                Id = item.Id,
                AcquisitionId = item.AcquisitionId,
                RawMaterialId = item.RawMaterialId,
                RawMaterialName = item.Name,
                RawMaterialColor = item.Color,
                Quantity = item.Quantity,
                QuantityType = item.QuantityType,
                ActualUnitCost = item.ActualUnitCost,
                Notes = item.Notes,
                CreatedAt = item.CreatedAt,
                UpdatedAt = item.UpdatedAt,
                EstimatedTotalCost = item.EstimatedTotalCost,
                ActualTotalCost = item.ActualTotalCost
            };
        }
    }
}
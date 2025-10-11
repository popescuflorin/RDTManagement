using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProductionManagement.API.Models;
using ProductionManagement.API.Repositories;
using System.Security.Claims;

namespace ProductionManagement.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AcquisitionController : ControllerBase
    {
        private readonly IAcquisitionRepository _acquisitionRepository;
        private readonly IUserRepository _userRepository;
        private readonly ISupplierRepository _supplierRepository;
        private readonly IRawMaterialRepository _rawMaterialRepository;

        public AcquisitionController(
            IAcquisitionRepository acquisitionRepository,
            IUserRepository userRepository,
            ISupplierRepository supplierRepository,
            IRawMaterialRepository rawMaterialRepository)
        {
            _acquisitionRepository = acquisitionRepository;
            _userRepository = userRepository;
            _supplierRepository = supplierRepository;
            _rawMaterialRepository = rawMaterialRepository;
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Manager,User")]
        public async Task<ActionResult<IEnumerable<AcquisitionDto>>> GetAcquisitions()
        {
            var acquisitions = await _acquisitionRepository.GetActiveAcquisitionsAsync();
            var acquisitionDtos = acquisitions.Select(MapToDto).ToList();

            return Ok(acquisitionDtos);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Admin,Manager,User")]
        public async Task<ActionResult<AcquisitionDto>> GetAcquisition(int id)
        {
            var acquisition = await _acquisitionRepository.GetByIdWithItemsAsync(id);

            if (acquisition == null)
            {
                return NotFound();
            }

            return Ok(MapToDto(acquisition));
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

            // Get user info from repository
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                return Unauthorized("User not found");
            }

            // Get supplier name if supplier is selected
            string? supplierName = null;
            if (request.SupplierId.HasValue)
            {
                var supplier = await _supplierRepository.GetByIdAsync(request.SupplierId.Value);
                supplierName = supplier?.Name;
            }

            var acquisition = new Acquisition
            {
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
                    var createdMaterial = await _rawMaterialRepository.AddAsync(newRawMaterial);
                    rawMaterialId = createdMaterial.Id;
                }
                else
                {
                    // Verify existing raw material exists
                    var existingRawMaterial = await _rawMaterialRepository.GetByIdAsync(rawMaterialId);
                    if (existingRawMaterial == null)
                    {
                        return BadRequest($"Raw material with ID {rawMaterialId} not found");
                    }
                }

                var item = new AcquisitionItem
                {
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

            var createdAcquisition = await _acquisitionRepository.AddAsync(acquisition);

            return CreatedAtAction(nameof(GetAcquisition), new { id = createdAcquisition.Id }, MapToDto(createdAcquisition));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<AcquisitionDto>> UpdateAcquisition(int id, UpdateAcquisitionRequest request)
        {
            var acquisition = await _acquisitionRepository.GetByIdWithItemsAsync(id);

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
                var supplier = await _supplierRepository.GetByIdAsync(request.SupplierId.Value);
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
                    var createdMaterial = await _rawMaterialRepository.AddAsync(newRawMaterial);
                    rawMaterialId = createdMaterial.Id;
                }
                else
                {
                    // Verify existing raw material exists
                    var existingRawMaterial = await _rawMaterialRepository.GetByIdAsync(rawMaterialId);
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

            await _acquisitionRepository.UpdateAsync(acquisition);

            return Ok(MapToDto(acquisition));
        }

        [HttpPost("{id}/receive")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<AcquisitionDto>> ReceiveAcquisition(int id, ReceiveAcquisitionRequest request)
        {
            var acquisition = await _acquisitionRepository.GetByIdWithItemsAsync(id);

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
                var rawMaterial = await _rawMaterialRepository.GetByIdAsync(acquisitionItem.RawMaterialId);
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

                    await _rawMaterialRepository.UpdateAsync(rawMaterial);
                }
            }

            // Update acquisition status
            acquisition.Status = AcquisitionStatus.Received;
            acquisition.ReceivedAt = DateTime.UtcNow;
            acquisition.ReceivedByUserId = userId;
            acquisition.TotalActualCost = acquisition.Items.Sum(i => i.ActualTotalCost);

            await _acquisitionRepository.UpdateAsync(acquisition);

            return Ok(MapToDto(acquisition));
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> DeleteAcquisition(int id)
        {
            var acquisition = await _acquisitionRepository.GetByIdAsync(id);

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

            await _acquisitionRepository.UpdateAsync(acquisition);

            return NoContent();
        }

        [HttpGet("statistics")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<ActionResult<AcquisitionStatistics>> GetStatistics()
        {
            var activeAcquisitions = await _acquisitionRepository.GetActiveAcquisitionsAsync();

            var statistics = new AcquisitionStatistics
            {
                TotalAcquisitions = activeAcquisitions.Count(),
                DraftAcquisitions = await _acquisitionRepository.GetCountByStatusAsync(AcquisitionStatus.Draft),
                ReceivedAcquisitions = await _acquisitionRepository.GetCountByStatusAsync(AcquisitionStatus.Received),
                CancelledAcquisitions = await _acquisitionRepository.GetCountByStatusAsync(AcquisitionStatus.Cancelled),
                TotalEstimatedCost = await _acquisitionRepository.GetTotalCostByStatusAsync(AcquisitionStatus.Draft, false),
                TotalActualCost = await _acquisitionRepository.GetTotalCostByStatusAsync(AcquisitionStatus.Received, true),
                TotalItems = activeAcquisitions.Sum(a => a.Items.Count),
                TotalQuantity = activeAcquisitions.Sum(a => a.Items.Sum(i => (int)i.Quantity))
            };

            return Ok(statistics);
        }

        private AcquisitionDto MapToDto(Acquisition acquisition)
        {
            // Note: For performance, we should ideally include user data in the query
            // For now, we'll use the user names from the acquisition entity itself
            var createdByUserName = "Unknown";
            var receivedByUserName = acquisition.ReceivedByUserId.HasValue ? "Unknown" : null;

            // In a real scenario, you'd want to include user data in the repository query
            // or create a separate method that loads user data efficiently

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
                CreatedByUserName = createdByUserName,
                ReceivedByUserId = acquisition.ReceivedByUserId,
                ReceivedByUserName = receivedByUserName,
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
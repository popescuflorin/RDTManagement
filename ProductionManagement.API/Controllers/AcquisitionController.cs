using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProductionManagement.API.Authorization;
using ProductionManagement.API.Data;
using ProductionManagement.API.Models;
using ProductionManagement.API.Repositories;
using ProductionManagement.API.Services;
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
        private readonly ITransportRepository _transportRepository;
        private readonly IEmailService _emailService;
        private readonly ApplicationDbContext _context;

        public AcquisitionController(
            IAcquisitionRepository acquisitionRepository,
            IUserRepository userRepository,
            ISupplierRepository supplierRepository,
            IRawMaterialRepository rawMaterialRepository,
            ITransportRepository transportRepository,
            IEmailService emailService,
            ApplicationDbContext context)
        {
            _acquisitionRepository = acquisitionRepository;
            _userRepository = userRepository;
            _supplierRepository = supplierRepository;
            _rawMaterialRepository = rawMaterialRepository;
            _transportRepository = transportRepository;
            _emailService = emailService;
            _context = context;
        }

        [HttpGet]
        [RequirePermission(Permissions.ViewAcquisitionsTab)]
        public async Task<ActionResult<IEnumerable<AcquisitionDto>>> GetAcquisitions()
        {
            var acquisitions = await _acquisitionRepository.GetActiveAcquisitionsAsync();
            var acquisitionDtos = acquisitions.Select(MapToDto).ToList();

            return Ok(acquisitionDtos);
        }

        [HttpGet("{id}")]
        [RequirePermission(Permissions.ViewAcquisition)]
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
        [RequirePermission(Permissions.CreateAcquisition)]
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
                AssignedToUserId = request.AssignedToUserId ?? userId, // Default to creator if not specified
                SupplierId = request.SupplierId,
                SupplierName = supplierName,
                SupplierContact = request.SupplierContact,
                Notes = request.Notes,
                DueDate = request.DueDate,
                TransportId = request.TransportId,
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
                        Type = acquisition.Type == AcquisitionType.RawMaterials ? MaterialType.RawMaterial : MaterialType.RecyclableMaterial,
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
                    OrderedQuantity = itemRequest.Quantity,
                    ReceivedQuantity = null, // Not received yet
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

            // Log creation history
            await LogHistoryAsync(createdAcquisition.Id, userId, "Created", $"Acquisition created with {acquisition.Items.Count} items");
            
            // Send email notifications
            await SendAcquisitionCreatedEmailsAsync(createdAcquisition, user);
            
            return CreatedAtAction(nameof(GetAcquisition), new { id = createdAcquisition.Id }, MapToDto(createdAcquisition));
        }

        [HttpPut("{id}")]
        [RequirePermission(Permissions.EditAcquisition)]
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

            // Track changes for email notification
            var changes = new List<string>();
            var oldTitle = acquisition.Title;
            var oldDescription = acquisition.Description;
            var oldAssignedToUserId = acquisition.AssignedToUserId;
            var oldSupplierId = acquisition.SupplierId;
            var oldSupplierContact = acquisition.SupplierContact;
            var oldTransportId = acquisition.TransportId;
            var oldTransportDate = acquisition.TransportDate;
            var oldTransportNotes = acquisition.TransportNotes;
            var oldItemsCount = acquisition.Items.Count(i => i.IsActive);

            // Get supplier name if supplier is selected
            string? supplierName = null;
            if (request.SupplierId.HasValue)
            {
                var supplier = await _supplierRepository.GetByIdAsync(request.SupplierId.Value);
                supplierName = supplier?.Name;
            }

            // Track title change
            if (oldTitle != request.Title)
            {
                changes.Add($"✏️ Title changed from \"{oldTitle}\" to \"{request.Title}\"");
            }

            // Track description change
            if (oldDescription != request.Description)
            {
                changes.Add($"📝 Description updated");
            }

            // Track assigned user change
            if (oldAssignedToUserId != request.AssignedToUserId)
            {
                var oldAssignedUser = oldAssignedToUserId.HasValue ? await _userRepository.GetByIdAsync(oldAssignedToUserId.Value) : null;
                var newAssignedUser = request.AssignedToUserId.HasValue ? await _userRepository.GetByIdAsync(request.AssignedToUserId.Value) : null;
                var oldAssignedName = oldAssignedUser != null ? $"{oldAssignedUser.FirstName} {oldAssignedUser.LastName}" : "None";
                var newAssignedName = newAssignedUser != null ? $"{newAssignedUser.FirstName} {newAssignedUser.LastName}" : "None";
                changes.Add($"👤 Assigned user changed from \"{oldAssignedName}\" to \"{newAssignedName}\"");
            }

            // Track supplier change
            if (oldSupplierId != request.SupplierId)
            {
                var oldSupplier = oldSupplierId.HasValue ? await _supplierRepository.GetByIdAsync(oldSupplierId.Value) : null;
                var newSupplier = request.SupplierId.HasValue ? await _supplierRepository.GetByIdAsync(request.SupplierId.Value) : null;
                var oldSupplierName = oldSupplier?.Name ?? "None";
                var newSupplierName = newSupplier?.Name ?? "None";
                changes.Add($"🏢 Supplier changed from \"{oldSupplierName}\" to \"{newSupplierName}\"");
            }

            // Track supplier contact change
            if (oldSupplierContact != request.SupplierContact && !string.IsNullOrEmpty(request.SupplierContact))
            {
                changes.Add($"📞 Supplier contact updated");
            }

            // Track transport changes
            if (oldTransportId != request.TransportId)
            {
                var oldTransport = oldTransportId.HasValue ? await _transportRepository.GetByIdAsync(oldTransportId.Value) : null;
                var newTransport = request.TransportId.HasValue ? await _transportRepository.GetByIdAsync(request.TransportId.Value) : null;
                var oldTransportName = oldTransport?.CarName ?? "None";
                var newTransportName = newTransport?.CarName ?? "None";
                changes.Add($"🚚 Transport changed from \"{oldTransportName}\" to \"{newTransportName}\"");
            }

            if (oldTransportDate != request.TransportDate && request.TransportDate.HasValue)
            {
                changes.Add($"📅 Transport date updated to {request.TransportDate.Value:MMM dd, yyyy}");
            }

            if (oldTransportNotes != request.TransportNotes && !string.IsNullOrEmpty(request.TransportNotes))
            {
                changes.Add($"📋 Transport notes updated");
            }

            acquisition.Title = request.Title;
            acquisition.Description = request.Description;
            acquisition.AssignedToUserId = request.AssignedToUserId;
            acquisition.SupplierId = request.SupplierId;
            acquisition.SupplierName = supplierName;
            acquisition.SupplierContact = request.SupplierContact;
            acquisition.Notes = request.Notes;
            acquisition.DueDate = request.DueDate;
            acquisition.TransportId = request.TransportId;
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
                        Type = acquisition.Type == AcquisitionType.RawMaterials ? MaterialType.RawMaterial : MaterialType.RecyclableMaterial,
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
                        existingItem.OrderedQuantity = itemRequest.Quantity;
                        // Don't update ReceivedQuantity here - it's only set during reception
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
                        OrderedQuantity = itemRequest.Quantity,
                        ReceivedQuantity = null, // Not received yet
                        QuantityType = itemRequest.QuantityType,
                        Notes = itemRequest.Notes,
                        CreatedAt = DateTime.UtcNow,
                        IsActive = true
                    };
                    acquisition.Items.Add(newItem);
                }
            }

            // Track materials changes
            var newItemsCount = acquisition.Items.Count(i => i.IsActive);
            if (oldItemsCount != newItemsCount)
            {
                changes.Add($"📦 Materials list updated: {oldItemsCount} → {newItemsCount} items");
            }

            // Calculate total estimated cost (always 0 for materials)
            acquisition.TotalEstimatedCost = 0;

            await _acquisitionRepository.UpdateAsync(acquisition);

            // Get user ID and user info for history and email
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out int userId))
            {
                // Log update history
                var changesText = changes.Any() ? string.Join("; ", changes) : "No significant changes";
                await LogHistoryAsync(acquisition.Id, userId, "Updated", $"Acquisition details updated. Items: {acquisition.Items.Count(i => i.IsActive)}", changesText);
                
                // Send email notifications if there are changes
                if (changes.Any())
                {
                    var user = await _userRepository.GetByIdAsync(userId);
                    if (user != null)
                    {
                        await SendAcquisitionUpdatedEmailsAsync(acquisition, user, changes);
                    }
                }
            }

            return Ok(MapToDto(acquisition));
        }

        [HttpPost("{id}/receive")]
        [RequirePermission(Permissions.ReceiveAcquisition)]
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

            // Update items with received quantities
            foreach (var itemRequest in request.Items)
            {
                var acquisitionItem = acquisition.Items.FirstOrDefault(i => i.Id == itemRequest.AcquisitionItemId);
                if (acquisitionItem == null)
                {
                    return BadRequest($"Acquisition item with ID {itemRequest.AcquisitionItemId} not found");
                }

                // Set the received quantity (keeping ordered quantity intact)
                acquisitionItem.ReceivedQuantity = itemRequest.ReceivedQuantity;
                acquisitionItem.ActualUnitCost = itemRequest.ActualUnitCost;
                acquisitionItem.UpdatedAt = DateTime.UtcNow;

                // For Raw Materials, add directly to inventory
                if (acquisition.Type == AcquisitionType.RawMaterials)
                {
                    var rawMaterial = await _rawMaterialRepository.GetByIdAsync(acquisitionItem.RawMaterialId);
                    if (rawMaterial != null)
                    {
                        rawMaterial.Quantity += itemRequest.ReceivedQuantity;
                        rawMaterial.UpdatedAt = DateTime.UtcNow;

                        // Update unit cost using weighted average
                        if (acquisitionItem.ActualUnitCost.HasValue)
                        {
                            var currentTotalValue = (rawMaterial.Quantity - itemRequest.ReceivedQuantity) * rawMaterial.UnitCost;
                            var newTotalValue = currentTotalValue + (itemRequest.ReceivedQuantity * acquisitionItem.ActualUnitCost.Value);
                            var newTotalQuantity = rawMaterial.Quantity;
                            
                            if (newTotalQuantity > 0)
                            {
                                rawMaterial.UnitCost = newTotalValue / newTotalQuantity;
                            }
                        }

                        await _rawMaterialRepository.UpdateAsync(rawMaterial);
                    }
                }
                // For Recyclable Materials, don't add to inventory yet (they need processing)
            }

            // Update acquisition status based on type
            if (acquisition.Type == AcquisitionType.RawMaterials)
            {
                acquisition.Status = AcquisitionStatus.Received;
                // Log history for raw materials receipt
                await LogHistoryAsync(acquisition.Id, userId, "Received", $"Raw materials received and added to inventory. Total: {acquisition.TotalQuantity} units");
            }
            else if (acquisition.Type == AcquisitionType.RecyclableMaterials)
            {
                acquisition.Status = AcquisitionStatus.ReadyForProcessing;
                // Log history for recyclables receipt
                await LogHistoryAsync(acquisition.Id, userId, "Ready for Processing", $"Recyclable materials received and ready for processing. Total: {acquisition.TotalQuantity} units");
            }
            
            acquisition.ReceivedAt = DateTime.UtcNow;
            acquisition.ReceivedByUserId = userId;
            acquisition.TotalActualCost = acquisition.Items.Sum(i => i.ActualTotalCost);

            await _acquisitionRepository.UpdateAsync(acquisition);

            // Send email notifications
            var user = await _userRepository.GetByIdAsync(userId);
            if (user != null)
            {
                await SendAcquisitionReceivedEmailsAsync(acquisition, user);
            }

            return Ok(MapToDto(acquisition));
        }

        [HttpPost("{id}/process")]
        [RequirePermission(Permissions.ProcessAcquisition)]
        public async Task<ActionResult<AcquisitionDto>> ProcessAcquisition(int id, ProcessAcquisitionRequest request)
        {
            var acquisition = await _acquisitionRepository.GetByIdWithItemsAsync(id);

            if (acquisition == null)
            {
                return NotFound();
            }

            if (acquisition.Status != AcquisitionStatus.ReadyForProcessing)
            {
                return BadRequest("Only acquisitions with 'Ready for Processing' status can be processed");
            }

            if (acquisition.Type != AcquisitionType.RecyclableMaterials)
            {
                return BadRequest("Only recyclable material acquisitions can be processed");
            }

            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized("Invalid user ID");
            }

            // Validate that recyclable item IDs exist in the acquisition
            var recyclableItemIds = acquisition.Items.Select(i => i.Id).ToHashSet();
            foreach (var material in request.Materials)
            {
                if (!recyclableItemIds.Contains(material.RecyclableItemId))
                {
                    return BadRequest($"Recyclable item with ID {material.RecyclableItemId} not found in this acquisition");
                }
            }

            // Validate quantities don't exceed available recyclable quantities
            var recyclableQuantities = acquisition.Items.ToDictionary(i => i.Id, i => i.EffectiveQuantity);
            var processedQuantities = request.Materials
                .GroupBy(m => m.RecyclableItemId)
                .ToDictionary(g => g.Key, g => g.Sum(m => m.Quantity));

            foreach (var (itemId, processedQty) in processedQuantities)
            {
                if (processedQty > recyclableQuantities[itemId])
                {
                    var item = acquisition.Items.First(i => i.Id == itemId);
                    return BadRequest($"Total processed quantity for '{item.Name}' exceeds available quantity ({recyclableQuantities[itemId]} {item.QuantityType})");
                }
            }

            // Process materials: create new or add to existing raw materials
            foreach (var material in request.Materials)
            {
                RawMaterial rawMaterial;

                if (material.RawMaterialId == 0)
                {
                    // Create new raw material
                    rawMaterial = new RawMaterial
                    {
                        Name = material.Name,
                        Color = material.Color,
                        Description = material.Description,
                        Quantity = material.Quantity,
                        QuantityType = material.UnitOfMeasure,
                        UnitCost = 0, // No cost for processed recyclables
                        Type = MaterialType.RawMaterial, // Processed recyclables become raw materials
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    await _rawMaterialRepository.AddAsync(rawMaterial);
                }
                else
                {
                    // Add to existing raw material
                    var existingRawMaterial = await _rawMaterialRepository.GetByIdAsync(material.RawMaterialId);
                    if (existingRawMaterial == null)
                    {
                        return BadRequest($"Raw material with ID {material.RawMaterialId} not found");
                    }

                    existingRawMaterial.Quantity += material.Quantity;
                    existingRawMaterial.UpdatedAt = DateTime.UtcNow;

                    await _rawMaterialRepository.UpdateAsync(existingRawMaterial);
                    rawMaterial = existingRawMaterial;
                }

                // Track the processed material relationship
                var processedMaterial = new ProcessedMaterial
                {
                    AcquisitionId = acquisition.Id,
                    AcquisitionItemId = material.RecyclableItemId,
                    RawMaterialId = rawMaterial.Id,
                    Quantity = material.Quantity,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                acquisition.ProcessedMaterials.Add(processedMaterial);
            }

            // Update acquisition status to Received (processing complete)
            acquisition.Status = AcquisitionStatus.Received;
            acquisition.ReceivedAt = DateTime.UtcNow;
            acquisition.ReceivedByUserId = userId;
            acquisition.UpdatedAt = DateTime.UtcNow;

            await _acquisitionRepository.UpdateAsync(acquisition);

            // Log processing history
            var totalProcessed = request.Materials.Sum(m => m.Quantity);
            await LogHistoryAsync(acquisition.Id, userId, "Processed", $"Recyclable materials processed into {request.Materials.Count} raw material types. Total output: {totalProcessed} units");

            // Send email notifications
            var user = await _userRepository.GetByIdAsync(userId);
            if (user != null)
            {
                await SendAcquisitionProcessedEmailsAsync(acquisition, user, request.Materials.Count, totalProcessed);
            }

            return Ok(MapToDto(acquisition));
        }

        [HttpDelete("{id}")]
        [RequirePermission(Permissions.CancelAcquisition)]
        public async Task<IActionResult> DeleteAcquisition(int id)
        {
            var acquisition = await _acquisitionRepository.GetByIdWithItemsAsync(id);

            if (acquisition == null)
            {
                return NotFound();
            }

            if (acquisition.Status != AcquisitionStatus.Draft)
            {
                return BadRequest("Only draft acquisitions can be deleted");
            }

            // Get user ID for email notification
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out int userId))
            {
                var user = await _userRepository.GetByIdAsync(userId);
                if (user != null)
                {
                    // Send email notifications before deleting
                    await SendAcquisitionDeletedEmailsAsync(acquisition, user);
                }
            }

            acquisition.IsActive = false;
            acquisition.UpdatedAt = DateTime.UtcNow;

            await _acquisitionRepository.UpdateAsync(acquisition);

            return NoContent();
        }

        [HttpPost("{id}/cancel")]
        [RequirePermission(Permissions.CancelAcquisition)]
        public async Task<ActionResult<AcquisitionDto>> CancelAcquisition(int id)
        {
            var acquisition = await _acquisitionRepository.GetByIdWithItemsAsync(id);

            if (acquisition == null)
            {
                return NotFound();
            }

            if (acquisition.Status != AcquisitionStatus.Draft)
            {
                return BadRequest("Only draft acquisitions can be cancelled");
            }

            acquisition.Status = AcquisitionStatus.Cancelled;
            acquisition.UpdatedAt = DateTime.UtcNow;

            await _acquisitionRepository.UpdateAsync(acquisition);

            // Get user ID and log cancellation
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out int userId))
            {
                await LogHistoryAsync(acquisition.Id, userId, "Cancelled", "Acquisition cancelled");
                var user = await _userRepository.GetByIdAsync(userId);
                if (user != null)
                {
                    // Send email notifications before deleting
                    await SendAcquisitionDeletedEmailsAsync(acquisition, user);
                }
            }

            return Ok(MapToDto(acquisition));
        }

        [HttpGet("statistics")]
        [RequirePermission(Permissions.ViewAcquisitionsTab)]
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
                TotalQuantity = activeAcquisitions.Sum(a => a.Items.Sum(i => (int)i.EffectiveQuantity))
            };

            return Ok(statistics);
        }

        private AcquisitionDto MapToDto(Acquisition acquisition)
        {
            // Note: For performance, we should ideally include user data in the query
            // For now, we'll use the user names from the acquisition entity itself
            var createdByUserName = acquisition.CreatedBy?.Username ?? "Unknown";
            var receivedByUserName = acquisition.ReceivedBy?.Username;
            var assignedToUserName = acquisition.AssignedTo?.Username;

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
                AssignedToUserId = acquisition.AssignedToUserId,
                AssignedToUserName = assignedToUserName,
                SupplierId = acquisition.SupplierId,
                SupplierName = acquisition.SupplierName,
                SupplierContact = acquisition.SupplierContact,
                Notes = acquisition.Notes,
                DueDate = acquisition.DueDate,
                TransportId = acquisition.TransportId,
                TransportCarName = acquisition.Transport?.CarName,
                TransportPhoneNumber = acquisition.Transport?.PhoneNumber,
                TransportDate = acquisition.TransportDate,
                TransportNotes = acquisition.TransportNotes,
                TotalEstimatedCost = acquisition.TotalEstimatedCost,
                TotalActualCost = acquisition.TotalActualCost,
                TotalItems = acquisition.Items.Count,
                TotalQuantity = acquisition.Items.Sum(i => (int)i.EffectiveQuantity),
                CanEdit = acquisition.Status == AcquisitionStatus.Draft,
                CanDelete = acquisition.Status == AcquisitionStatus.Draft,
                CanReceive = acquisition.Status == AcquisitionStatus.Draft,
                Items = acquisition.Items.Select(MapItemToDto).ToList(),
                ProcessedMaterials = acquisition.ProcessedMaterials.Select(MapProcessedMaterialToDto).ToList(),
                History = acquisition.History.OrderByDescending(h => h.Timestamp).Select(MapHistoryToDto).ToList()
            };
        }

        private AcquisitionHistoryDto MapHistoryToDto(AcquisitionHistory history)
        {
            return new AcquisitionHistoryDto
            {
                Id = history.Id,
                AcquisitionId = history.AcquisitionId,
                UserId = history.UserId,
                UserName = history.User?.Username ?? "Unknown",
                Action = history.Action,
                Timestamp = history.Timestamp,
                Changes = history.Changes,
                Notes = history.Notes
            };
        }

        private ProcessedMaterialDto MapProcessedMaterialToDto(ProcessedMaterial pm)
        {
            return new ProcessedMaterialDto
            {
                Id = pm.Id,
                AcquisitionId = pm.AcquisitionId,
                AcquisitionItemId = pm.AcquisitionItemId,
                RawMaterialId = pm.RawMaterialId,
                RawMaterialName = pm.RawMaterial?.Name ?? string.Empty,
                RawMaterialColor = pm.RawMaterial?.Color ?? string.Empty,
                RawMaterialQuantityType = pm.RawMaterial?.QuantityType ?? string.Empty,
                Quantity = pm.Quantity,
                CreatedAt = pm.CreatedAt
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
                OrderedQuantity = item.OrderedQuantity,
                ReceivedQuantity = item.ReceivedQuantity,
                Quantity = item.EffectiveQuantity, // Use effective quantity for backward compatibility
                QuantityType = item.QuantityType,
                ActualUnitCost = item.ActualUnitCost,
                Notes = item.Notes,
                CreatedAt = item.CreatedAt,
                UpdatedAt = item.UpdatedAt,
                EstimatedTotalCost = item.EstimatedTotalCost,
                ActualTotalCost = item.ActualTotalCost
            };
        }

        private async Task LogHistoryAsync(int acquisitionId, int userId, string action, string? notes = null, string? changes = null)
        {
            var history = new AcquisitionHistory
            {
                AcquisitionId = acquisitionId,
                UserId = userId,
                Action = action,
                Timestamp = DateTime.UtcNow,
                Notes = notes,
                Changes = changes,
                IsActive = true
            };

            await _context.AcquisitionHistories.AddAsync(history);
            await _context.SaveChangesAsync();
        }

        private async Task SendAcquisitionCreatedEmailsAsync(Acquisition acquisition, User createdByUser)
        {
            try
            {
                var acquisitionNumber = $"ACQ-{acquisition.Id:D5}";
                var acquisitionType = acquisition.Type == AcquisitionType.RawMaterials 
                    ? "Raw Materials" 
                    : "Recyclable Materials";
                var createdByName = $"{createdByUser.FirstName} {createdByUser.LastName}";

                // Get transport details if available
                string? transportCarName = null;
                string? transportPhoneNumber = null;
                if (acquisition.TransportId.HasValue)
                {
                    var transport = await _transportRepository.GetByIdAsync(acquisition.TransportId.Value);
                    if (transport != null)
                    {
                        transportCarName = transport.CarName;
                        transportPhoneNumber = transport.PhoneNumber;
                    }
                }

                // Prepare items list for email
                var itemsList = acquisition.Items.Select(item => new ProductionManagement.API.Services.AcquisitionItemEmailDto
                {
                    Name = item.Name,
                    Color = item.Color,
                    OrderedQuantity = item.OrderedQuantity,
                    ReceivedQuantity = item.ReceivedQuantity,
                    Quantity = item.OrderedQuantity, // For creation email, use ordered quantity
                    QuantityType = item.QuantityType
                }).ToList();

                // Get assigned user if different from creator
                User? assignedUser = null;
                string? assignedToName = null;
                
                if (acquisition.AssignedToUserId.HasValue && acquisition.AssignedToUserId != acquisition.CreatedByUserId)
                {
                    assignedUser = await _userRepository.GetByIdAsync(acquisition.AssignedToUserId.Value);
                    if (assignedUser != null)
                    {
                        assignedToName = $"{assignedUser.FirstName} {assignedUser.LastName}";
                        
                        // Send email to assigned user (only if they have email notifications enabled)
                        if (assignedUser.ReceiveEmails)
                        {
                            await _emailService.SendAcquisitionCreatedAsync(
                            toEmail: assignedUser.Email,
                            userName: assignedToName,
                            acquisitionTitle: acquisition.Title,
                            acquisitionNumber: acquisitionNumber,
                            acquisitionType: acquisitionType,
                            createdBy: createdByName,
                            assignedToUser: assignedToName,
                            description: acquisition.Description,
                            supplierName: acquisition.SupplierName,
                            supplierContact: acquisition.SupplierContact,
                            transportCarName: transportCarName,
                            transportPhoneNumber: transportPhoneNumber,
                            transportDate: acquisition.TransportDate,
                            transportNotes: acquisition.TransportNotes,
                            items: itemsList
                            );
                        }
                    }
                }

                // Send email to all admin users
                var adminUsers = await _userRepository.GetUsersByRoleAsync("Admin");
                foreach (var admin in adminUsers)
                {
                    // Skip if admin is the creator or the assigned user (already notified)
                    if (admin.Id == acquisition.CreatedByUserId || 
                        (assignedUser != null && admin.Id == assignedUser.Id))
                    {
                        continue;
                    }

                    // Only send email if admin has email notifications enabled
                    if (admin.ReceiveEmails)
                    {
                        await _emailService.SendAcquisitionCreatedAsync(
                        toEmail: admin.Email,
                        userName: $"{admin.FirstName} {admin.LastName}",
                        acquisitionTitle: acquisition.Title,
                        acquisitionNumber: acquisitionNumber,
                        acquisitionType: acquisitionType,
                        createdBy: createdByName,
                        assignedToUser: assignedToName,
                        description: acquisition.Description,
                        supplierName: acquisition.SupplierName,
                        supplierContact: acquisition.SupplierContact,
                        transportCarName: transportCarName,
                        transportPhoneNumber: transportPhoneNumber,
                        transportDate: acquisition.TransportDate,
                        transportNotes: acquisition.TransportNotes,
                        items: itemsList
                        );
                    }
                }
            }
            catch (Exception ex)
            {
                // Log the error but don't fail the acquisition creation
                // You could use ILogger here to log the exception
                Console.WriteLine($"Error sending acquisition created emails: {ex.Message}");
            }
        }

        private async Task SendAcquisitionUpdatedEmailsAsync(Acquisition acquisition, User updatedByUser, List<string> changes)
        {
            try
            {
                var acquisitionNumber = $"ACQ-{acquisition.Id:D5}";
                var acquisitionType = acquisition.Type == AcquisitionType.RawMaterials 
                    ? "Raw Materials" 
                    : "Recyclable Materials";
                var updatedByName = $"{updatedByUser.FirstName} {updatedByUser.LastName}";

                // Get transport details if available
                string? transportCarName = null;
                string? transportPhoneNumber = null;
                if (acquisition.TransportId.HasValue)
                {
                    var transport = await _transportRepository.GetByIdAsync(acquisition.TransportId.Value);
                    if (transport != null)
                    {
                        transportCarName = transport.CarName;
                        transportPhoneNumber = transport.PhoneNumber;
                    }
                }

                // Prepare items list for email
                var itemsList = acquisition.Items.Where(i => i.IsActive).Select(item => new ProductionManagement.API.Services.AcquisitionItemEmailDto
                {
                    Name = item.Name,
                    Color = item.Color,
                    OrderedQuantity = item.OrderedQuantity,
                    ReceivedQuantity = item.ReceivedQuantity,
                    Quantity = item.EffectiveQuantity,
                    QuantityType = item.QuantityType
                }).ToList();

                // Get assigned user
                User? assignedUser = null;
                string? assignedToName = null;
                
                if (acquisition.AssignedToUserId.HasValue)
                {
                    assignedUser = await _userRepository.GetByIdAsync(acquisition.AssignedToUserId.Value);
                    if (assignedUser != null)
                    {
                        assignedToName = $"{assignedUser.FirstName} {assignedUser.LastName}";
                        
                        // Send email to assigned user if not the updater (and if they have email notifications enabled)
                        if (assignedUser.Id != updatedByUser.Id && assignedUser.ReceiveEmails)
                        {
                            await _emailService.SendAcquisitionUpdatedAsync(
                                toEmail: assignedUser.Email,
                                userName: assignedToName,
                                acquisitionTitle: acquisition.Title,
                                acquisitionNumber: acquisitionNumber,
                                acquisitionType: acquisitionType,
                                updatedBy: updatedByName,
                                changes: changes,
                                assignedToUser: assignedToName,
                                description: acquisition.Description,
                                supplierName: acquisition.SupplierName,
                                supplierContact: acquisition.SupplierContact,
                                transportCarName: transportCarName,
                                transportPhoneNumber: transportPhoneNumber,
                                transportDate: acquisition.TransportDate,
                                transportNotes: acquisition.TransportNotes,
                                items: itemsList
                            );
                        }
                    }
                }

                // Send email to all admin users
                var adminUsers = await _userRepository.GetUsersByRoleAsync("Admin");
                foreach (var admin in adminUsers)
                {
                    // Skip if admin is the updater or the assigned user (already notified)
                    if (admin.Id == updatedByUser.Id || 
                        (assignedUser != null && admin.Id == assignedUser.Id))
                    {
                        continue;
                    }

                    // Only send email if admin has email notifications enabled
                    if (admin.ReceiveEmails)
                    {
                        await _emailService.SendAcquisitionUpdatedAsync(
                        toEmail: admin.Email,
                        userName: $"{admin.FirstName} {admin.LastName}",
                        acquisitionTitle: acquisition.Title,
                        acquisitionNumber: acquisitionNumber,
                        acquisitionType: acquisitionType,
                        updatedBy: updatedByName,
                        changes: changes,
                        assignedToUser: assignedToName,
                        description: acquisition.Description,
                        supplierName: acquisition.SupplierName,
                        supplierContact: acquisition.SupplierContact,
                        transportCarName: transportCarName,
                        transportPhoneNumber: transportPhoneNumber,
                        transportDate: acquisition.TransportDate,
                        transportNotes: acquisition.TransportNotes,
                        items: itemsList
                        );
                    }
                }

                // Send email to creator if they're not the updater, assigned user, or admin
                if (acquisition.CreatedByUserId != updatedByUser.Id && 
                    (assignedUser == null || acquisition.CreatedByUserId != assignedUser.Id))
                {
                    var creator = await _userRepository.GetByIdAsync(acquisition.CreatedByUserId);
                    if (creator != null && !adminUsers.Any(a => a.Id == creator.Id) && creator.ReceiveEmails)
                    {
                        var creatorName = $"{creator.FirstName} {creator.LastName}";
                        await _emailService.SendAcquisitionUpdatedAsync(
                            toEmail: creator.Email,
                            userName: creatorName,
                            acquisitionTitle: acquisition.Title,
                            acquisitionNumber: acquisitionNumber,
                            acquisitionType: acquisitionType,
                            updatedBy: updatedByName,
                            changes: changes,
                            assignedToUser: assignedToName,
                            description: acquisition.Description,
                            supplierName: acquisition.SupplierName,
                            supplierContact: acquisition.SupplierContact,
                            transportCarName: transportCarName,
                            transportPhoneNumber: transportPhoneNumber,
                            transportDate: acquisition.TransportDate,
                            transportNotes: acquisition.TransportNotes,
                            items: itemsList
                        );
                    }
                }
            }
            catch (Exception ex)
            {
                // Log the error but don't fail the acquisition update
                // You could use ILogger here to log the exception
                Console.WriteLine($"Error sending acquisition updated emails: {ex.Message}");
            }
        }

        private async Task SendAcquisitionDeletedEmailsAsync(Acquisition acquisition, User deletedByUser)
        {
            try
            {
                var acquisitionNumber = $"ACQ-{acquisition.Id:D5}";
                var acquisitionType = acquisition.Type == AcquisitionType.RawMaterials 
                    ? "Raw Materials" 
                    : "Recyclable Materials";
                var deletedByName = $"{deletedByUser.FirstName} {deletedByUser.LastName}";

                // Get transport details if available
                string? transportCarName = null;
                string? transportPhoneNumber = null;
                if (acquisition.TransportId.HasValue)
                {
                    var transport = await _transportRepository.GetByIdAsync(acquisition.TransportId.Value);
                    if (transport != null)
                    {
                        transportCarName = transport.CarName;
                        transportPhoneNumber = transport.PhoneNumber;
                    }
                }

                // Prepare items list for email
                var itemsList = acquisition.Items.Where(i => i.IsActive).Select(item => new ProductionManagement.API.Services.AcquisitionItemEmailDto
                {
                    Name = item.Name,
                    Color = item.Color,
                    OrderedQuantity = item.OrderedQuantity,
                    ReceivedQuantity = item.ReceivedQuantity,
                    Quantity = item.EffectiveQuantity,
                    QuantityType = item.QuantityType
                }).ToList();

                // Get assigned user
                User? assignedUser = null;
                string? assignedToName = null;
                
                if (acquisition.AssignedToUserId.HasValue)
                {
                    assignedUser = await _userRepository.GetByIdAsync(acquisition.AssignedToUserId.Value);
                    if (assignedUser != null)
                    {
                        assignedToName = $"{assignedUser.FirstName} {assignedUser.LastName}";
                        
                        // Send email to assigned user if not the deleter (and if they have email notifications enabled)
                        if (assignedUser.Id != deletedByUser.Id && assignedUser.ReceiveEmails)
                        {
                            await _emailService.SendAcquisitionDeletedAsync(
                                toEmail: assignedUser.Email,
                                userName: assignedToName,
                                acquisitionTitle: acquisition.Title,
                                acquisitionNumber: acquisitionNumber,
                                acquisitionType: acquisitionType,
                                deletedBy: deletedByName,
                                assignedToUser: assignedToName,
                                description: acquisition.Description,
                                supplierName: acquisition.SupplierName,
                                supplierContact: acquisition.SupplierContact,
                                transportCarName: transportCarName,
                                transportPhoneNumber: transportPhoneNumber,
                                transportDate: acquisition.TransportDate,
                                transportNotes: acquisition.TransportNotes,
                                items: itemsList
                            );
                        }
                    }
                }

                // Send email to all admin users
                var adminUsers = await _userRepository.GetUsersByRoleAsync("Admin");
                foreach (var admin in adminUsers)
                {
                    // Skip if admin is the deleter or the assigned user (already notified)
                    if (admin.Id == deletedByUser.Id || 
                        (assignedUser != null && admin.Id == assignedUser.Id))
                    {
                        continue;
                    }

                    // Only send email if admin has email notifications enabled
                    if (admin.ReceiveEmails)
                    {
                        await _emailService.SendAcquisitionDeletedAsync(
                            toEmail: admin.Email,
                            userName: $"{admin.FirstName} {admin.LastName}",
                            acquisitionTitle: acquisition.Title,
                            acquisitionNumber: acquisitionNumber,
                            acquisitionType: acquisitionType,
                            deletedBy: deletedByName,
                            assignedToUser: assignedToName,
                            description: acquisition.Description,
                            supplierName: acquisition.SupplierName,
                            supplierContact: acquisition.SupplierContact,
                            transportCarName: transportCarName,
                            transportPhoneNumber: transportPhoneNumber,
                            transportDate: acquisition.TransportDate,
                            transportNotes: acquisition.TransportNotes,
                            items: itemsList
                        );
                    }
                }

                // Send email to creator if they're not the deleter, assigned user, or admin
                if (acquisition.CreatedByUserId != deletedByUser.Id && 
                    (assignedUser == null || acquisition.CreatedByUserId != assignedUser.Id))
                {
                    var creator = await _userRepository.GetByIdAsync(acquisition.CreatedByUserId);
                    if (creator != null && !adminUsers.Any(a => a.Id == creator.Id) && creator.ReceiveEmails)
                    {
                        var creatorName = $"{creator.FirstName} {creator.LastName}";
                        await _emailService.SendAcquisitionDeletedAsync(
                            toEmail: creator.Email,
                            userName: creatorName,
                            acquisitionTitle: acquisition.Title,
                            acquisitionNumber: acquisitionNumber,
                            acquisitionType: acquisitionType,
                            deletedBy: deletedByName,
                            assignedToUser: assignedToName,
                            description: acquisition.Description,
                            supplierName: acquisition.SupplierName,
                            supplierContact: acquisition.SupplierContact,
                            transportCarName: transportCarName,
                            transportPhoneNumber: transportPhoneNumber,
                            transportDate: acquisition.TransportDate,
                            transportNotes: acquisition.TransportNotes,
                            items: itemsList
                        );
                    }
                }
            }
            catch (Exception ex)
            {
                // Log the error but don't fail the acquisition deletion
                // You could use ILogger here to log the exception
                Console.WriteLine($"Error sending acquisition deleted emails: {ex.Message}");
            }
        }

        private async Task SendAcquisitionReceivedEmailsAsync(Acquisition acquisition, User receivedByUser)
        {
            try
            {
                var acquisitionNumber = $"ACQ-{acquisition.Id:D5}";
                var acquisitionType = acquisition.Type == AcquisitionType.RawMaterials 
                    ? "Raw Materials" 
                    : "Recyclable Materials";
                var receivedByName = $"{receivedByUser.FirstName} {receivedByUser.LastName}";

                // Get transport details if available
                string? transportCarName = null;
                string? transportPhoneNumber = null;
                if (acquisition.TransportId.HasValue)
                {
                    var transport = await _transportRepository.GetByIdAsync(acquisition.TransportId.Value);
                    if (transport != null)
                    {
                        transportCarName = transport.CarName;
                        transportPhoneNumber = transport.PhoneNumber;
                    }
                }

                // Prepare items list for email
                var itemsList = acquisition.Items.Where(i => i.IsActive).Select(item => new ProductionManagement.API.Services.AcquisitionItemEmailDto
                {
                    Name = item.Name,
                    Color = item.Color,
                    OrderedQuantity = item.OrderedQuantity,
                    ReceivedQuantity = item.ReceivedQuantity,
                    Quantity = item.EffectiveQuantity,
                    QuantityType = item.QuantityType
                }).ToList();

                // Get assigned user
                User? assignedUser = null;
                string? assignedToName = null;
                
                if (acquisition.AssignedToUserId.HasValue)
                {
                    assignedUser = await _userRepository.GetByIdAsync(acquisition.AssignedToUserId.Value);
                    if (assignedUser != null)
                    {
                        assignedToName = $"{assignedUser.FirstName} {assignedUser.LastName}";
                        
                        // Send email to assigned user if not the receiver (and if they have email notifications enabled)
                        if (assignedUser.Id != receivedByUser.Id && assignedUser.ReceiveEmails)
                        {
                            await _emailService.SendAcquisitionReceivedAsync(
                                toEmail: assignedUser.Email,
                                userName: assignedToName,
                                acquisitionTitle: acquisition.Title,
                                acquisitionNumber: acquisitionNumber,
                                acquisitionType: acquisitionType,
                                receivedBy: receivedByName,
                                assignedToUser: assignedToName,
                                description: acquisition.Description,
                                supplierName: acquisition.SupplierName,
                                supplierContact: acquisition.SupplierContact,
                                transportCarName: transportCarName,
                                transportPhoneNumber: transportPhoneNumber,
                                transportDate: acquisition.TransportDate,
                                transportNotes: acquisition.TransportNotes,
                                totalActualCost: acquisition.TotalActualCost,
                                items: itemsList
                            );
                        }
                    }
                }

                // Send email to all admin users
                var adminUsers = await _userRepository.GetUsersByRoleAsync("Admin");
                foreach (var admin in adminUsers)
                {
                    // Skip if admin is the receiver or the assigned user (already notified)
                    if (admin.Id == receivedByUser.Id || 
                        (assignedUser != null && admin.Id == assignedUser.Id))
                    {
                        continue;
                    }

                    // Only send email if admin has email notifications enabled
                    if (admin.ReceiveEmails)
                    {
                        await _emailService.SendAcquisitionReceivedAsync(
                            toEmail: admin.Email,
                            userName: $"{admin.FirstName} {admin.LastName}",
                            acquisitionTitle: acquisition.Title,
                            acquisitionNumber: acquisitionNumber,
                            acquisitionType: acquisitionType,
                            receivedBy: receivedByName,
                            assignedToUser: assignedToName,
                            description: acquisition.Description,
                            supplierName: acquisition.SupplierName,
                            supplierContact: acquisition.SupplierContact,
                            transportCarName: transportCarName,
                            transportPhoneNumber: transportPhoneNumber,
                            transportDate: acquisition.TransportDate,
                            transportNotes: acquisition.TransportNotes,
                            totalActualCost: acquisition.TotalActualCost,
                            items: itemsList
                        );
                    }
                }

                // Send email to creator if they're not the receiver, assigned user, or admin
                if (acquisition.CreatedByUserId != receivedByUser.Id && 
                    (assignedUser == null || acquisition.CreatedByUserId != assignedUser.Id))
                {
                    var creator = await _userRepository.GetByIdAsync(acquisition.CreatedByUserId);
                    if (creator != null && !adminUsers.Any(a => a.Id == creator.Id) && creator.ReceiveEmails)
                    {
                        var creatorName = $"{creator.FirstName} {creator.LastName}";
                        await _emailService.SendAcquisitionReceivedAsync(
                            toEmail: creator.Email,
                            userName: creatorName,
                            acquisitionTitle: acquisition.Title,
                            acquisitionNumber: acquisitionNumber,
                            acquisitionType: acquisitionType,
                            receivedBy: receivedByName,
                            assignedToUser: assignedToName,
                            description: acquisition.Description,
                            supplierName: acquisition.SupplierName,
                            supplierContact: acquisition.SupplierContact,
                            transportCarName: transportCarName,
                            transportPhoneNumber: transportPhoneNumber,
                            transportDate: acquisition.TransportDate,
                            transportNotes: acquisition.TransportNotes,
                            totalActualCost: acquisition.TotalActualCost,
                            items: itemsList
                        );
                    }
                }
            }
            catch (Exception ex)
            {
                // Log the error but don't fail the acquisition reception
                Console.WriteLine($"Error sending acquisition received emails: {ex.Message}");
            }
        }

        private async Task SendAcquisitionProcessedEmailsAsync(Acquisition acquisition, User processedByUser, int materialsProcessed, decimal totalOutputQuantity)
        {
            try
            {
                var acquisitionNumber = $"ACQ-{acquisition.Id:D5}";
                var processedByName = $"{processedByUser.FirstName} {processedByUser.LastName}";

                // Prepare input items list for email (the recyclable materials)
                var itemsList = acquisition.Items.Where(i => i.IsActive).Select(item => new ProductionManagement.API.Services.AcquisitionItemEmailDto
                {
                    Name = item.Name,
                    Color = item.Color,
                    OrderedQuantity = item.OrderedQuantity,
                    ReceivedQuantity = item.ReceivedQuantity,
                    Quantity = item.EffectiveQuantity,
                    QuantityType = item.QuantityType
                }).ToList();

                // Prepare output materials list for email (the processed raw materials)
                var processedMaterialsList = acquisition.ProcessedMaterials.Where(pm => pm.IsActive).Select(pm => new ProductionManagement.API.Services.ProcessedMaterialEmailDto
                {
                    Name = pm.RawMaterial.Name,
                    Color = pm.RawMaterial.Color,
                    Quantity = pm.Quantity,
                    QuantityType = pm.RawMaterial.QuantityType
                }).ToList();

                // Get assigned user
                User? assignedUser = null;
                string? assignedToName = null;
                
                if (acquisition.AssignedToUserId.HasValue)
                {
                    assignedUser = await _userRepository.GetByIdAsync(acquisition.AssignedToUserId.Value);
                    if (assignedUser != null)
                    {
                        assignedToName = $"{assignedUser.FirstName} {assignedUser.LastName}";
                        
                        // Send email to assigned user if not the processor (and if they have email notifications enabled)
                        if (assignedUser.Id != processedByUser.Id && assignedUser.ReceiveEmails)
                        {
                            await _emailService.SendAcquisitionProcessedAsync(
                                toEmail: assignedUser.Email,
                                userName: assignedToName,
                                acquisitionTitle: acquisition.Title,
                                acquisitionNumber: acquisitionNumber,
                                processedBy: processedByName,
                                materialsProcessed: materialsProcessed,
                                totalOutputQuantity: totalOutputQuantity,
                                assignedToUser: assignedToName,
                                description: acquisition.Description,
                                items: itemsList,
                                processedMaterials: processedMaterialsList
                            );
                        }
                    }
                }

                // Send email to all admin users
                var adminUsers = await _userRepository.GetUsersByRoleAsync("Admin");
                foreach (var admin in adminUsers)
                {
                    // Skip if admin is the processor or the assigned user (already notified)
                    if (admin.Id == processedByUser.Id || 
                        (assignedUser != null && admin.Id == assignedUser.Id))
                    {
                        continue;
                    }

                    // Only send email if admin has email notifications enabled
                    if (admin.ReceiveEmails)
                    {
                        await _emailService.SendAcquisitionProcessedAsync(
                            toEmail: admin.Email,
                            userName: $"{admin.FirstName} {admin.LastName}",
                            acquisitionTitle: acquisition.Title,
                            acquisitionNumber: acquisitionNumber,
                            processedBy: processedByName,
                            materialsProcessed: materialsProcessed,
                            totalOutputQuantity: totalOutputQuantity,
                            assignedToUser: assignedToName,
                            description: acquisition.Description,
                            items: itemsList,
                            processedMaterials: processedMaterialsList
                        );
                    }
                }

                // Send email to creator if they're not the processor, assigned user, or admin
                if (acquisition.CreatedByUserId != processedByUser.Id && 
                    (assignedUser == null || acquisition.CreatedByUserId != assignedUser.Id))
                {
                    var creator = await _userRepository.GetByIdAsync(acquisition.CreatedByUserId);
                    if (creator != null && !adminUsers.Any(a => a.Id == creator.Id) && creator.ReceiveEmails)
                    {
                        var creatorName = $"{creator.FirstName} {creator.LastName}";
                        await _emailService.SendAcquisitionProcessedAsync(
                            toEmail: creator.Email,
                            userName: creatorName,
                            acquisitionTitle: acquisition.Title,
                            acquisitionNumber: acquisitionNumber,
                            processedBy: processedByName,
                            materialsProcessed: materialsProcessed,
                            totalOutputQuantity: totalOutputQuantity,
                            assignedToUser: assignedToName,
                            description: acquisition.Description,
                            items: itemsList,
                            processedMaterials: processedMaterialsList
                        );
                    }
                }
            }
            catch (Exception ex)
            {
                // Log the error but don't fail the acquisition processing
                Console.WriteLine($"Error sending acquisition processed emails: {ex.Message}");
            }
        }
    }
}


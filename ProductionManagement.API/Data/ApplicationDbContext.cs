using Microsoft.EntityFrameworkCore;
using ProductionManagement.API.Models;

namespace ProductionManagement.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        // DbSets
        public DbSet<User> Users { get; set; }
        public DbSet<RawMaterial> RawMaterials { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<ProductMaterial> ProductMaterials { get; set; }
        public DbSet<ProductTemplate> ProductTemplates { get; set; }
        public DbSet<ProductTemplateMaterial> ProductTemplateMaterials { get; set; }
        public DbSet<ProductionPlan> ProductionPlans { get; set; }
        public DbSet<ProductionPlanMaterial> ProductionPlanMaterials { get; set; }
        public DbSet<Acquisition> Acquisitions { get; set; }
        public DbSet<AcquisitionItem> AcquisitionItems { get; set; }
        public DbSet<ProcessedMaterial> ProcessedMaterials { get; set; }
        public DbSet<AcquisitionHistory> AcquisitionHistories { get; set; }
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<Transport> Transports { get; set; }
        public DbSet<Client> Clients { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderMaterial> OrderMaterials { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Username).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Role).IsRequired().HasMaxLength(20);
                entity.Property(e => e.PasswordHash).IsRequired();
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasIndex(e => e.Email).IsUnique();
            });

            // RawMaterial configuration
            modelBuilder.Entity<RawMaterial>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Color).IsRequired().HasMaxLength(100);
                entity.Property(e => e.QuantityType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Quantity).HasPrecision(18, 2);
                entity.Property(e => e.MinimumStock).HasPrecision(18, 2);
                entity.Property(e => e.UnitCost).HasPrecision(18, 2);
            });

            // Product configuration
            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.SellingPrice).HasPrecision(18, 2);
            });

            // ProductMaterial configuration
            modelBuilder.Entity<ProductMaterial>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.RequiredQuantity).HasPrecision(18, 2);
                entity.Property(e => e.MaterialName).HasMaxLength(200);
                entity.Property(e => e.MaterialColor).HasMaxLength(100);
                entity.Property(e => e.QuantityType).HasMaxLength(50);

                entity.HasOne<Product>()
                    .WithMany(p => p.RequiredMaterials)
                    .HasForeignKey(e => e.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne<RawMaterial>()
                    .WithMany()
                    .HasForeignKey(e => e.MaterialId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Supplier configuration
            modelBuilder.Entity<Supplier>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.ContactPerson).HasMaxLength(100);
                entity.Property(e => e.Email).HasMaxLength(100);
                entity.Property(e => e.Phone).HasMaxLength(20);
                entity.Property(e => e.Address).HasMaxLength(200);
                entity.Ignore(e => e.TotalAcquisitions);
                entity.Ignore(e => e.TotalAcquisitionValue);
                entity.Ignore(e => e.LastAcquisitionDate);
            });

            // Transport configuration
            modelBuilder.Entity<Transport>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CarName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.PhoneNumber).IsRequired().HasMaxLength(20);
            });

            // Acquisition configuration
            modelBuilder.Entity<Acquisition>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.TotalEstimatedCost).HasPrecision(18, 2);
                entity.Property(e => e.TotalActualCost).HasPrecision(18, 2);

                entity.HasOne(e => e.CreatedBy)
                    .WithMany()
                    .HasForeignKey(e => e.CreatedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.ReceivedBy)
                    .WithMany()
                    .HasForeignKey(e => e.ReceivedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.AssignedTo)
                    .WithMany()
                    .HasForeignKey(e => e.AssignedToUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Supplier)
                    .WithMany()
                    .HasForeignKey(e => e.SupplierId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Transport)
                    .WithMany(t => t.Acquisitions)
                    .HasForeignKey(e => e.TransportId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ProcessedMaterial configuration
            modelBuilder.Entity<ProcessedMaterial>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Quantity).HasPrecision(18, 2);

                entity.HasOne(e => e.Acquisition)
                    .WithMany(a => a.ProcessedMaterials)
                    .HasForeignKey(e => e.AcquisitionId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.AcquisitionItem)
                    .WithMany()
                    .HasForeignKey(e => e.AcquisitionItemId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.RawMaterial)
                    .WithMany()
                    .HasForeignKey(e => e.RawMaterialId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // AcquisitionHistory configuration
            modelBuilder.Entity<AcquisitionHistory>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Action).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Notes).HasMaxLength(500);

                entity.HasOne(e => e.Acquisition)
                    .WithMany(a => a.History)
                    .HasForeignKey(e => e.AcquisitionId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // AcquisitionItem configuration
            modelBuilder.Entity<AcquisitionItem>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Color).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Quantity).HasPrecision(18, 2);
                entity.Property(e => e.QuantityType).IsRequired().HasMaxLength(50);
                entity.Property(e => e.ActualUnitCost).HasPrecision(18, 2);

                entity.HasOne(e => e.Acquisition)
                    .WithMany(a => a.Items)
                    .HasForeignKey(e => e.AcquisitionId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.RawMaterial)
                    .WithMany()
                    .HasForeignKey(e => e.RawMaterialId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ProductionPlan configuration
            modelBuilder.Entity<ProductionPlan>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.QuantityToProduce).HasPrecision(18, 2);
                entity.Property(e => e.EstimatedCost).HasPrecision(18, 2);
                entity.Property(e => e.ActualCost).HasPrecision(18, 2);

                entity.HasOne(e => e.TargetProduct)
                    .WithMany()
                    .HasForeignKey(e => e.TargetProductId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.CreatedByUser)
                    .WithMany()
                    .HasForeignKey(e => e.CreatedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.StartedByUser)
                    .WithMany()
                    .HasForeignKey(e => e.StartedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.CompletedByUser)
                    .WithMany()
                    .HasForeignKey(e => e.CompletedByUserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ProductionPlanMaterial configuration
            modelBuilder.Entity<ProductionPlanMaterial>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.RequiredQuantity).HasPrecision(18, 2);
                entity.Property(e => e.ActualQuantityUsed).HasPrecision(18, 2);
                entity.Property(e => e.EstimatedUnitCost).HasPrecision(18, 2);
                entity.Property(e => e.ActualUnitCost).HasPrecision(18, 2);

                entity.HasOne(e => e.ProductionPlan)
                    .WithMany(p => p.RequiredMaterials)
                    .HasForeignKey(e => e.ProductionPlanId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.RawMaterial)
                    .WithMany()
                    .HasForeignKey(e => e.RawMaterialId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // ProductTemplate configuration
            modelBuilder.Entity<ProductTemplate>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                entity.HasOne(e => e.FinishedProduct)
                    .WithMany()
                    .HasForeignKey(e => e.FinishedProductId)
                    .OnDelete(DeleteBehavior.Cascade);

                // One template per finished product
                entity.HasIndex(e => e.FinishedProductId).IsUnique();
            });

            // ProductTemplateMaterial configuration
            modelBuilder.Entity<ProductTemplateMaterial>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.RequiredQuantity).HasPrecision(18, 2);

                entity.HasOne(e => e.ProductTemplate)
                    .WithMany(p => p.RequiredMaterials)
                    .HasForeignKey(e => e.ProductTemplateId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.RawMaterial)
                    .WithMany()
                    .HasForeignKey(e => e.RawMaterialId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Client configuration
            modelBuilder.Entity<Client>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.ContactPerson).HasMaxLength(100);
                entity.Property(e => e.Email).HasMaxLength(100);
                entity.Property(e => e.Phone).HasMaxLength(20);
                entity.Property(e => e.Address).HasMaxLength(200);
                entity.Property(e => e.City).HasMaxLength(100);
                entity.Property(e => e.PostalCode).HasMaxLength(50);
                entity.Property(e => e.Country).HasMaxLength(100);
                entity.Property(e => e.Notes).HasMaxLength(1000);
                entity.Property(e => e.CreatedByUserName).IsRequired().HasMaxLength(100);
            });

            // Order configuration
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Description).HasMaxLength(500);
                entity.Property(e => e.Notes).HasMaxLength(1000);
                entity.Property(e => e.CreatedByUserName).IsRequired().HasMaxLength(100);

                entity.HasOne(e => e.Client)
                    .WithMany(c => c.Orders)
                    .HasForeignKey(e => e.ClientId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Transport)
                    .WithMany(t => t.Orders)
                    .HasForeignKey(e => e.TransportId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // OrderMaterial configuration
            modelBuilder.Entity<OrderMaterial>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Quantity).HasPrecision(18, 2);
                entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
                entity.Property(e => e.MaterialName).IsRequired().HasMaxLength(200);
                entity.Property(e => e.MaterialColor).IsRequired().HasMaxLength(100);
                entity.Property(e => e.QuantityType).IsRequired().HasMaxLength(50);

                entity.HasOne(e => e.Order)
                    .WithMany(o => o.OrderMaterials)
                    .HasForeignKey(e => e.OrderId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.RawMaterial)
                    .WithMany()
                    .HasForeignKey(e => e.RawMaterialId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Seed initial data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // Seed admin user
            modelBuilder.Entity<User>().HasData(
                new User
                {
                    Id = 1,
                    Username = "admin",
                    Email = "admin@productionmanagement.com",
                    FirstName = "Admin",
                    LastName = "User",
                    Role = "Admin",
                    PasswordHash = HashPassword("admin123"),
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    IsActive = true
                }
            );

            // Seed some raw materials
            modelBuilder.Entity<RawMaterial>().HasData(
                new RawMaterial
                {
                    Id = 1,
                    Name = "Steel Sheets",
                    Color = "Silver",
                    Quantity = 150.5m,
                    QuantityType = "kg",
                    MinimumStock = 50,
                    UnitCost = 2.50m,
                    Description = "High-grade steel sheets for manufacturing",
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2024, 1, 5, 0, 0, 0, DateTimeKind.Utc),
                    IsActive = true
                },
                new RawMaterial
                {
                    Id = 2,
                    Name = "Aluminum Rods",
                    Color = "Silver",
                    Quantity = 75,
                    QuantityType = "pieces",
                    MinimumStock = 20,
                    UnitCost = 15.00m,
                    Description = "6mm aluminum rods",
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2024, 1, 10, 0, 0, 0, DateTimeKind.Utc),
                    IsActive = true
                },
                new RawMaterial
                {
                    Id = 3,
                    Name = "Paint",
                    Color = "Blue",
                    Quantity = 25.8m,
                    QuantityType = "liters",
                    MinimumStock = 10,
                    UnitCost = 12.00m,
                    Description = "High-quality blue paint",
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                    UpdatedAt = new DateTime(2024, 1, 15, 0, 0, 0, DateTimeKind.Utc),
                    IsActive = true
                }
            );
        }

        private string HashPassword(string password)
        {
            using var sha256 = System.Security.Cryptography.SHA256.Create();
            var hashedBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }
    }
}


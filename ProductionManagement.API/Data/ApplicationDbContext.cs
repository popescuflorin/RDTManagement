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
        public DbSet<Acquisition> Acquisitions { get; set; }
        public DbSet<AcquisitionItem> AcquisitionItems { get; set; }
        public DbSet<Supplier> Suppliers { get; set; }

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

            // Acquisition configuration
            modelBuilder.Entity<Acquisition>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.TotalEstimatedCost).HasPrecision(18, 2);
                entity.Property(e => e.TotalActualCost).HasPrecision(18, 2);
                entity.Property(e => e.TransportCarName).HasMaxLength(100);
                entity.Property(e => e.TransportPhoneNumber).HasMaxLength(20);

                entity.HasOne(e => e.Supplier)
                    .WithMany()
                    .HasForeignKey(e => e.SupplierId)
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


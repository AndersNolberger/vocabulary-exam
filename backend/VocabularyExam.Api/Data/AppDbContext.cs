using Microsoft.EntityFrameworkCore;
using VocabularyExam.Api.Models;

namespace VocabularyExam.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<WordSet> WordSets { get; set; }
        public DbSet<WordPair> WordPairs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            // Additional model configuration can be done here
        }
    }
}
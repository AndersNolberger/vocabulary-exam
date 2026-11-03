using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using VocabularyExam.Api.Data;
using VocabularyExam.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    if (builder.Configuration["Database:Provider"] == "Sqlite")
        options.UseSqlite(connectionString);
    else
        options.UseSqlServer(connectionString);
});

builder.Services.AddControllers();
builder.Services.AddDbContext<ProgressDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
    if (builder.Configuration["Database:Provider"] == "Sqlite")
        options.UseSqlite(connectionString, sql => sql.MigrationsHistoryTable("__ProgressMigrationsHistory"));
    else
        options.UseSqlServer(connectionString, sql => sql.MigrationsHistoryTable("__ProgressMigrationsHistory"));
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Authentication
builder.Services.AddScoped<IWordSetService, WordSetService>();
builder.Services.AddScoped<IQuizService, QuizService>();
builder.Services.AddScoped<ProgressService>();
builder.Services.AddSingleton<ISpellCheckService, SpellCheckService>();

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Events.OnRedirectToLogin = ctx =>
        {
            ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
    })
    .AddMicrosoftAccount(options =>
    {
        options.ClientId = builder.Configuration["Authentication:Microsoft:ClientId"]!;
        options.ClientSecret = builder.Configuration["Authentication:Microsoft:ClientSecret"]!;
    });
builder.Services.AddAuthorization();

builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins("http://localhost:3000").AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var appDb = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    appDb.Database.EnsureCreated();
    EnsureWordPairExamplesColumn(appDb);
    EnsureWordSetLanguageColumn(appDb);
    scope.ServiceProvider.GetRequiredService<ProgressDbContext>().Database.Migrate();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();

static void EnsureWordPairExamplesColumn(AppDbContext context)
{
    var connection = context.Database.GetDbConnection();
    var wasOpen = connection.State == System.Data.ConnectionState.Open;
    if (!wasOpen) connection.Open();

    try
    {
        using var command = connection.CreateCommand();
        command.CommandText = context.Database.IsSqlite()
            ? "SELECT COUNT(*) FROM pragma_table_info('WordPairs') WHERE name = 'ExampleAndInflections'"
            : "SELECT CASE WHEN COL_LENGTH('dbo.WordPairs', 'ExampleAndInflections') IS NULL THEN 0 ELSE 1 END";
        var exists = Convert.ToInt32(command.ExecuteScalar()) > 0;
        if (exists) return;

        command.CommandText = context.Database.IsSqlite()
            ? "ALTER TABLE \"WordPairs\" ADD COLUMN \"ExampleAndInflections\" TEXT NULL"
            : "ALTER TABLE [dbo].[WordPairs] ADD [ExampleAndInflections] nvarchar(max) NULL";
        command.ExecuteNonQuery();
    }
    finally
    {
        if (!wasOpen) connection.Close();
    }
}

static void EnsureWordSetLanguageColumn(AppDbContext context)
{
    var connection = context.Database.GetDbConnection();
    var wasOpen = connection.State == System.Data.ConnectionState.Open;
    if (!wasOpen) connection.Open();

    try
    {
        using var command = connection.CreateCommand();
        command.CommandText = context.Database.IsSqlite()
            ? "SELECT COUNT(*) FROM pragma_table_info('WordSets') WHERE name = 'ForeignLanguage'"
            : "SELECT CASE WHEN COL_LENGTH('dbo.WordSets', 'ForeignLanguage') IS NULL THEN 0 ELSE 1 END";
        if (Convert.ToInt32(command.ExecuteScalar()) > 0) return;

        command.CommandText = context.Database.IsSqlite()
            ? "ALTER TABLE \"WordSets\" ADD COLUMN \"ForeignLanguage\" TEXT NOT NULL DEFAULT 'German'"
            : "ALTER TABLE [dbo].[WordSets] ADD [ForeignLanguage] nvarchar(20) NOT NULL CONSTRAINT [DF_WordSets_ForeignLanguage] DEFAULT 'German'";
        command.ExecuteNonQuery();
    }
    finally
    {
        if (!wasOpen) connection.Close();
    }
}
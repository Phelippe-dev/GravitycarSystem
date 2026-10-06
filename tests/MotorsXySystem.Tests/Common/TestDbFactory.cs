using System;
using Microsoft.EntityFrameworkCore;
using MotorsXySystem.Application.Interfaces;
using MotorsXySystem.Infrastructure.Data;

namespace MotorsXySystem.Tests.Common;

public static class TestDbFactory
{
    public static AppDbContext CreateInMemoryDbContext(ICurrentTenantService tenantService, string? dbName = null)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: dbName ?? Guid.NewGuid().ToString())
            .EnableSensitiveDataLogging()
            .Options;

        return new AppDbContext(options, tenantService);
    }
}

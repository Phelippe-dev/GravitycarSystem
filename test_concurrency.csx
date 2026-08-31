using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GravityCarSystem.Infrastructure.Data;
using Microsoft.Extensions.DependencyInjection;
using GravityCarSystem.Domain.Entities.Veiculos;

var services = new ServiceCollection();
services.AddDbContext<AppDbContext>(options => options.UseSqlServer(""Server=localhost\\SQLEXPRESS;Database=GravityCarSystem;Trusted_Connection=True;TrustServerCertificate=True""));
// Mock ICurrentTenantService
var sp = services.BuildServiceProvider();
var db = sp.GetRequiredService<AppDbContext>();

try {
    var v = db.Veiculos.Include(x => x.Fotos).FirstOrDefault(x => x.Id == Guid.Parse(""24697099-83a3-470a-a59a-1d179ede4d85""));
    if (v != null) {
        var foto = new VeiculoFoto { Url = ""test"", Principal = true };
        v.Fotos.Add(foto);
        db.SaveChanges();
    }
} catch (DbUpdateConcurrencyException ex) {
    foreach(var entry in ex.Entries) {
        Console.WriteLine(""Concurrency exception on: "" + entry.Entity.GetType().Name);
    }
} catch (Exception ex) {
    Console.WriteLine(ex.ToString());
}

using Microsoft.Data.Sqlite;
using System;

class Program
{
    static void Main()
    {
        var connectionString = "Data Source=../GravityCarSystem.API/gravitycarsystem.db";
        using (var connection = new SqliteConnection(connectionString))
        {
            connection.Open();
            try {
                var command = connection.CreateCommand();
                command.CommandText = "ALTER TABLE Veiculos ADD COLUMN Consignado INTEGER NOT NULL DEFAULT 0;";
                command.ExecuteNonQuery();
                Console.WriteLine("Column Consignado added successfully.");
            } catch (Exception ex) {
                Console.WriteLine(ex.Message);
            }
        }
    }
}

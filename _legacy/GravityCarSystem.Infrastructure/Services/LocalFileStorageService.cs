using System;
using System.IO;
using System.Threading.Tasks;
using GravityCarSystem.Application.Interfaces;
using Microsoft.AspNetCore.Hosting;

namespace GravityCarSystem.Infrastructure.Services;

public class LocalFileStorageService : IFileStorageService
{
    private readonly IWebHostEnvironment _env;

    public LocalFileStorageService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string folder)
    {
        if (fileStream == null || fileStream.Length == 0)
            throw new ArgumentException("O arquivo está vazio ou nulo.");

        // Proteção contra path traversal
        var safeFileName = Path.GetFileName(fileName);
        if (string.IsNullOrWhiteSpace(safeFileName) || safeFileName.Contains(".."))
            throw new ArgumentException("Nome de arquivo inválido.");

        // Whitelist de extensões permitidas
        var allowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", // imagens
            ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", // documentos
            ".mp4", ".avi", ".mov" // vídeos
        };
        var ext = Path.GetExtension(safeFileName);
        if (!allowedExtensions.Contains(ext))
            throw new ArgumentException($"Tipo de arquivo '{ext}' não permitido.");

        // Usa o diretório atual se IWebHostEnvironment.WebRootPath for nulo
        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        
        var uploadPath = Path.Combine(webRoot, "uploads", folder);
        if (!Directory.Exists(uploadPath))
            Directory.CreateDirectory(uploadPath);

        var uniqueFileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadPath, uniqueFileName);

        using (var destStream = new FileStream(filePath, FileMode.Create))
        {
            await fileStream.CopyToAsync(destStream);
        }

        // Retorna a rota relativa
        return $"/uploads/{folder}/{uniqueFileName}";
    }

    public void DeleteFile(string fileUrl)
    {
        if (string.IsNullOrEmpty(fileUrl)) return;

        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var filePath = Path.Combine(webRoot, fileUrl.TrimStart('/').Replace("/", "\\"));

        if (File.Exists(filePath))
        {
            File.Delete(filePath);
        }
    }
}

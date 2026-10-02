using System.IO;
using System.Threading.Tasks;

namespace GravityCarSystem.Application.Interfaces;

public interface IFileStorageService
{
    Task<string> UploadFileAsync(Stream fileStream, string fileName, string folder);
    void DeleteFile(string filePath);
}

using System.Text.Json;
using System.Text.Json.Serialization;

namespace SamuraiRealm.Api;

public static class JsonHelper
{
    public static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = new SnakeCaseNamingPolicy(),
        DictionaryKeyPolicy = new SnakeCaseNamingPolicy(),
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public static List<string> ParseList(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];
        try
        {
            return JsonSerializer.Deserialize<List<string>>(json, Options) ?? [];
        }
        catch
        {
            return [];
        }
    }

    public static string ToJson(IEnumerable<string> values) =>
        JsonSerializer.Serialize(values.ToList(), Options);
}

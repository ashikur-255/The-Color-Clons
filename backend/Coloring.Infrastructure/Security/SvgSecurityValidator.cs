using Coloring.Application.Interfaces.Security;
using System.Xml;
using System.Xml.Linq;

namespace Coloring.Infrastructure.Security;

public class SvgSecurityValidator : ISvgSecurityValidator
{
    private static readonly HashSet<string> BlockedElements =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "script",
            "foreignObject",
            "iframe",
            "object",
            "embed",
            "audio",
            "video",
            "canvas"
        };

    private static readonly HashSet<string> BlockedAttributes =
        new(StringComparer.OrdinalIgnoreCase)
        {
            "onload",
            "onclick",
            "onerror",
            "onmouseover",
            "onmouseenter",
            "onmouseleave",
            "onfocus",
            "onblur"
        };

    public async Task ValidateAsync(
        Stream svgStream,
        CancellationToken cancellationToken = default)
    {
        if (svgStream == null)
        {
            throw new InvalidOperationException(
                "SVG stream is required.");
        }

        if (svgStream.CanSeek)
        {
            svgStream.Position = 0;
        }

        using var memoryStream = new MemoryStream();

        await svgStream.CopyToAsync(
            memoryStream,
            cancellationToken);

        if (memoryStream.Length == 0)
        {
            throw new InvalidOperationException(
                "SVG file is empty.");
        }

        memoryStream.Position = 0;

        var settings = new XmlReaderSettings
        {
            Async = true,
            DtdProcessing = DtdProcessing.Prohibit,
            XmlResolver = null,
            MaxCharactersInDocument = 2 * 1024 * 1024,
            IgnoreComments = true,
            IgnoreWhitespace = true
        };

        XDocument document;

        try
        {
            using var reader = XmlReader.Create(
                memoryStream,
                settings);

            document = await XDocument.LoadAsync(
                reader,
                LoadOptions.None,
                cancellationToken);
        }
        catch (XmlException ex)
        {
            throw new InvalidOperationException(
                $"Invalid SVG/XML file: {ex.Message}");
        }

        var root = document.Root;

        if (root == null ||
            !string.Equals(
                root.Name.LocalName,
                "svg",
                StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException(
                "The uploaded file is not a valid SVG.");
        }

        ValidateElements(root);
        ValidateAttributes(root);

        if (svgStream.CanSeek)
        {
            svgStream.Position = 0;
        }
    }

    private static void ValidateElements(XElement root)
    {
        foreach (var element in root.DescendantsAndSelf())
        {
            if (BlockedElements.Contains(element.Name.LocalName))
            {
                throw new InvalidOperationException(
                    $"SVG contains a blocked element: <{element.Name.LocalName}>.");
            }
        }
    }

    private static void ValidateAttributes(XElement root)
    {
        foreach (var element in root.DescendantsAndSelf())
        {
            foreach (var attribute in element.Attributes())
            {
                var attributeName = attribute.Name.LocalName;

                if (BlockedAttributes.Contains(attributeName))
                {
                    throw new InvalidOperationException(
                        $"SVG contains a blocked event attribute: {attributeName}.");
                }

                if (string.Equals(
                        attributeName,
                        "href",
                        StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(
                        attributeName,
                        "src",
                        StringComparison.OrdinalIgnoreCase))
                {
                    var value = attribute.Value.Trim();

                    if (!string.IsNullOrWhiteSpace(value) &&
                        !value.StartsWith("#", StringComparison.Ordinal))
                    {
                        throw new InvalidOperationException(
                            "External SVG references are not allowed.");
                    }
                }
            }
        }
    }
}
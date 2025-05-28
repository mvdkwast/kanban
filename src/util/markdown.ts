/**
 * Process Markdown content to HTML with Tailwind CSS classes.
 * @param content simplified Markdown content
 */
export function processMarkdown(content: string): string {

    // Split into lines for processing
    const lines = content.split('\n');
    const processedLines: string[] = [];
    let inList = false;
    let inNumberedList = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Check for lists at the start of line
        const unorderedListMatch = line.match(/^(\s*)[-*+]\s+(.*)$/);
        const orderedListMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);

        if (unorderedListMatch) {
            if (!inList) {
                processedLines.push('<ul class="list-disc list-inside ml-2 my-1">');
                inList = true;
            }
            line = `<li>${processMarkdownInline(unorderedListMatch[2])}</li>`;
        } else if (orderedListMatch) {
            if (!inNumberedList) {
                processedLines.push('<ol class="list-decimal list-inside ml-2 my-1">');
                inNumberedList = true;
            }
            line = `<li>${processMarkdownInline(orderedListMatch[3])}</li>`;
        } else {
            // Close any open lists
            if (inList) {
                processedLines.push('</ul>');
                inList = false;
            }
            if (inNumberedList) {
                processedLines.push('</ol>');
                inNumberedList = false;
            }

            // Process headers
            if (line.match(/^###\s+/)) {
                line = `<h3 class="text-sm font-semibold mt-2">${processMarkdownInline(line.replace(/^###\s+/, ''))}</h3>`;
            } else if (line.match(/^##\s+/)) {
                line = `<h3 class="text-base font-semibold mt-2">${processMarkdownInline(line.replace(/^##\s+/, ''))}</h3>`;
            } else if (line.match(/^#\s+/)) {
                line = `<strong class="text-lg">${processMarkdownInline(line.replace(/^#\s+/, ''))}</strong>`;
            } else {
                // Regular paragraph
                line = processMarkdownInline(line);
            }
        }

        processedLines.push(line);
    }

    // Close any remaining open lists
    if (inList) processedLines.push('</ul>');
    if (inNumberedList) processedLines.push('</ol>');

    // Join lines and handle single newline as paragraph separator
    let result = processedLines.join('\n');

    // Split by newlines and wrap in paragraph divs for proper spacing
    const finalLines = result.split('\n');
    const wrappedLines: string[] = [];
    let currentParagraph: string[] = [];

    for (const line of finalLines) {
        if (line.startsWith('<ul') || line.startsWith('<ol') || line.startsWith('</ul') || line.startsWith('</ol')) {
            // Flush current paragraph if any
            if (currentParagraph.length > 0) {
                wrappedLines.push(`<div class="mb-2">${currentParagraph.join(' ')}</div>`);
                currentParagraph = [];
            }
            // Add list as-is
            wrappedLines.push(line);
        } else if (line.startsWith('<h3') || line.startsWith('<strong class="text-lg"')) {
            // Flush current paragraph if any
            if (currentParagraph.length > 0) {
                wrappedLines.push(`<div class="mb-2">${currentParagraph.join(' ')}</div>`);
                currentParagraph = [];
            }
            // Add header with its own spacing
            wrappedLines.push(`<div class="mb-2">${line}</div>`);
        } else if (line.trim() !== '') {
            currentParagraph.push(line);
        } else if (currentParagraph.length > 0) {
            // Empty line - flush current paragraph
            wrappedLines.push(`<div class="mb-2">${currentParagraph.join(' ')}</div>`);
            currentParagraph = [];
        }
    }

    // Flush any remaining paragraph
    if (currentParagraph.length > 0) {
        wrappedLines.push(`<div class="mb-2">${currentParagraph.join(' ')}</div>`);
    }

    return wrappedLines.join('');
}

// process inline markdown
function processMarkdownInline(text: string): string {
    return text
        // Strikethrough (process before other markers)
        .replace(/~~(.*?)~~/g, '<del>$1</del>')
        // Bold (process before italic)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        // Italic
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        // Inline code
        .replace(/`([^`]+)`/g, '<code class="bg-gray-700 px-1 rounded text-sm">$1</code>');
}

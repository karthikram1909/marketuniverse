
const fs = require('fs');
const path = require('path');

try {
    const filePath = path.join(__dirname, 'src', 'components', 'admin', 'DealOrNoDealPanel.jsx');
    let content = fs.readFileSync(filePath, 'utf8');

    // Fix 1: invalidateQueries
    // Use string replacer for exact pattern match if easier? No, capturing group needed.
    // Regex string: "queryClient\\.invalidateQueries\\({ queryKey: \\[(.*?)\\]\\);"
    // We need to escape backslashes for the string literal AND the regex.
    // In string literal: "\\" becomes "\".
    // In regex: "\(" matches "(".
    // So "\\(" in string becomes "\(" in regex.
    const regex1 = new RegExp("queryClient\\.invalidateQueries\\({ queryKey: \\[(.*?)\\]\\);", "g");
    content = content.replace(regex1, "queryClient.invalidateQueries({ queryKey: [$1] });");

    // Fix 2: Closing blocks
    const lines = content.split('\n');
    const newLines = lines.map(line => {
        if (line.trim() === ']);') {
            // Check if indent is 4, 8, or 12 spaces (standard indentation)
            // But we can enable for any indentation as long as it's purely closing.
            return line.replace(']);', '});');
        }
        return line;
    });

    content = newLines.join('\n');

    fs.writeFileSync(filePath, content);
    console.log('Fixed DealOrNoDealPanel.jsx syntax successfully.');
} catch (error) {
    console.error('Error fixing syntax:', error);
}

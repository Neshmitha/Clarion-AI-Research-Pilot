const fs = require('fs');
for (const file of ['src/pages/Workspace.jsx', 'src/pages/Library.jsx']) {
    let content = fs.readFileSync(file, 'utf8');
    
    content = content.replace(/border-2 border-black/g, 'border-gray-200 border');
    content = content.replace(/border-black/g, 'border-gray-200');

    // Remove the hard drop shadows
    content = content.replace(/shadow-\[4px_4px_0_#e2e8f0\]/g, 'shadow-sm');
    content = content.replace(/shadow-\[2px_2px_0_#e2e8f0\]/g, 'shadow-sm');
    content = content.replace(/shadow-\[4px_4px_0_rgba\(56,189,248,1\)\]/g, 'shadow-sm text-blue-500');
    content = content.replace(/shadow-\[2px_2px_0_rgba\(56,189,248,1\)\]/g, 'shadow-sm text-blue-500');
    content = content.replace(/shadow-\[2px_2px_0_rgba\(0,0,0,1\)\]/g, 'shadow-sm');
    
    fs.writeFileSync(file, content);
}

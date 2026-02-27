const fs = require('fs');
const path = require('path');

const dir = './client/src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find where SidebarItem "Paper Drafting" or similar is used
  // Or simply insert before "Workspace"
  
  if (content.includes('text="Workspace"')) {
    // Check if we need to add the icon import first
    if (!content.includes('Edit3')) {
      content = content.replace(/import {([^}]+)} from 'lucide-react';/, "import { $1, Edit3 } from 'lucide-react';");
    }
    
    // Add the SidebarItem
    if (!content.includes('text="DocSpace Editor"')) {
      const activeProp = file === 'DocSpace.jsx' ? ' active' : " onClick={() => navigate('/docspace')}";
      const replacement = `                    <SidebarItem icon={<Edit3 size={18} />} text="DocSpace Editor"${activeProp} />\n                    <SidebarItem icon={<FileText size={18} />} text="Workspace"`;
      
      content = content.replace(/<SidebarItem[^>]+text="Workspace"[^>]*>/, replacement);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${file}`);
    }
  }
}

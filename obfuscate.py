import re
import os
import sys
import json
import random
import string

def obfuscate_js(content):
    """Obfuscate JavaScript code"""
    # Remove comments
    content = re.sub(r'//.*$', '', content, flags=re.MULTILINE)
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    
    # Remove whitespace
    content = re.sub(r'\s+', ' ', content)
    content = re.sub(r';\s*', ';', content)
    content = re.sub(r'{\s*', '{', content)
    content = re.sub(r'}\s*', '}', content)
    content = re.sub(r'\(\s*', '(', content)
    content = re.sub(r'\)\s*', ')', content)
    content = re.sub(r',\s*', ',', content)
    content = re.sub(r'=\s*', '=', content)
    
    # Minify
    content = content.strip()
    
    return content

def obfuscate_html(content):
    """Obfuscate HTML by removing whitespace and comments"""
    # Remove HTML comments
    content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)
    
    # Remove whitespace between tags
    content = re.sub(r'>\s+<', '><', content)
    
    # Remove leading/trailing whitespace
    content = content.strip()
    
    return content

def obfuscate_css(content):
    """Obfuscate CSS by removing whitespace and comments"""
    # Remove CSS comments
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    
    # Remove whitespace
    content = re.sub(r'\s+', ' ', content)
    content = re.sub(r';\s*', ';', content)
    content = re.sub(r'{\s*', '{', content)
    content = re.sub(r'}\s*', '}', content)
    content = re.sub(r':\s*', ':', content)
    content = re.sub(r',\s*', ',', content)
    
    # Minify
    content = content.strip()
    
    return content

def process_file(filepath):
    """Process a single file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_size = len(content)
    
    if filepath.endswith('.js'):
        content = obfuscate_js(content)
    elif filepath.endswith('.html'):
        content = obfuscate_html(content)
    elif filepath.endswith('.css'):
        content = obfuscate_css(content)
    
    new_size = len(content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Processed: {filepath}")
    print(f"  Original: {original_size} bytes")
    print(f"  Obfuscated: {new_size} bytes")
    print(f"  Reduction: {original_size - new_size} bytes ({(1 - new_size/original_size)*100:.1f}%)")
    print()

def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python obfuscate.py <file_or_directory> [file_or_directory...]")
        sys.exit(1)
    
    for path in sys.argv[1:]:
        if os.path.isfile(path):
            process_file(path)
        elif os.path.isdir(path):
            for root, dirs, files in os.walk(path):
                for file in files:
                    if file.endswith(('.js', '.html', '.css')):
                        filepath = os.path.join(root, file)
                        process_file(filepath)
        else:
            print(f"Warning: {path} is not a file or directory")

if __name__ == '__main__':
    main()
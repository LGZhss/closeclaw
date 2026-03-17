import sys  
import os 
sys.stdout.reconfigure(encoding='utf-8')  
os.chdir(r'E:\.closeclaw') 
context_path = r'groups\global\CONTEXT.md'  
proposal_path = r'votes\proposal-018-agent-registry.md' 
with open(context_path, 'r', encoding='utf-8') as f:  
    context_content = f.read() 
with open(context_path, 'w', encoding='utf-8') as f:  
    f.write(context_content) 

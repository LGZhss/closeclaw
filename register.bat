@echo off  
python -c \"f=open('groups/global/CONTEXT.md','r',encoding='utf-8');c=f.read();f.close();c=c.replace(chr(124)+' **Cascade** | cascade | SWE-1.5 | 2026-03-15 |',chr(124)+' **Cascade** | cascade | SWE-1.5 | 2026-03-15 |'+chr(10)+chr(124)+' **TalkCody** | talkcody | MiniMax-M2.5 | 2026-03-15 |');f=open('groups/global/CONTEXT.md','w',encoding='utf-8');f.write(c);f.close()\"  

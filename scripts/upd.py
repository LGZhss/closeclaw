import os 
os.chdir\(r\"E:\\.closeclaw\"\) 
context = open\(r\"groups\\global\\CONTEXT.md\",\"r\",encoding=\"utf-8\"\).read\(\) 
context = context.replace\(\"\| \*\*Cascade\*\* \| cascade \| SWE-1.5 \| 2026-03-15 \| ?? ÒÑ×¢²á \|\",\"\| \*\*Cascade\*\* \| cascade \| SWE-1.5 \| 2026-03-15 \| ?? ÒÑ×¢²á \|\n\| \*\*TalkCody\*\* \| talkcody \| MiniMax-M2.5 \| 2026-03-15 \| ?? ÒÑ×¢²á \|\"\) 

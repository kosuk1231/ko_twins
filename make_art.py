
"""Generate self-contained miniature-diorama vector artwork (no emoji or network)."""
from pathlib import Path
import json, math, html, colorsys
ROOT=Path(__file__).resolve().parent
OUT=ROOT/"assets"/"cards"
OUT.mkdir(parents=True,exist_ok=True)
def shade(h, factor):
    h=h.lstrip("#")
    vals=[int(h[i:i+2],16) for i in (0,2,4)]
    if factor>1: vals=[round(v+(255-v)*(factor-1)) for v in vals]
    else: vals=[round(v*factor) for v in vals]
    return "#"+"".join(f"{max(0,min(255,v)):02x}" for v in vals)
class Scene:
 def __init__(self): self.colors=set()
 def fill(self,c):
    if c.startswith('#'):
        self.colors.add(c); return f'url(#g{c[1:]})'
    return c
 def ellipse(self,x,y,rx,ry,c,extra=""):
    return f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{self.fill(c)}" {extra}/>'
 def circle(self,x,y,r,c,extra=""): return self.ellipse(x,y,r,r,c,extra)
 def path(self,d,c,extra=""): return f'<path d="{d}" fill="{self.fill(c)}" {extra}/>'
 def line(self,d,c="#685548",w=4):
    return f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
 def rect(self,x,y,w,h,c,r=10,extra=""): return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="{self.fill(c)}" {extra}/>'
 def face(self,x,y,scale=1,nose=True):
    z=f'<g transform="translate({x} {y}) scale({scale})">'
    z+=self.ellipse(-22,0,5,7,"#343B3E")+self.ellipse(22,0,5,7,"#343B3E")
    z+=self.circle(-23,-2,1.6,"#FFFFFF")+self.circle(21,-2,1.6,"#FFFFFF")
    if nose: z+=self.ellipse(0,15,6,4,"#66534D")+self.line("M-7 25 Q0 31 7 25","#685548",2.4)
    return z+"</g>"
 def leaf(self,x,y,s=1,rot=0):
    return f'<g transform="translate({x} {y}) rotate({rot}) scale({s})">'+self.path("M0 0 C-30 -4 -28 -36 6 -45 C27 -18 20 -2 0 0","#71A664")+self.line("M0 0 L3 -32","#4F804A",2)+"</g>"
 def wrap(self,subject,label):
    defs='<defs><filter id="shadow" x="-30%" y="-30%" width="170%" height="180%"><feDropShadow dx="2" dy="7" stdDeviation="4" flood-color="#64594c" flood-opacity=".14"/></filter>'
    for c in sorted(self.colors):
        defs+=f'<radialGradient id="g{c[1:]}" cx="32%" cy="23%" r="90%"><stop stop-color="{shade(c,1.42)}"/><stop offset=".46" stop-color="{c}"/><stop offset="1" stop-color="{shade(c,.80)}"/></radialGradient>'
    defs+='</defs>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img"><title>{html.escape(label)} · 미니어처 일러스트</title>{defs}<rect width="400" height="400" rx="35" fill="#F8F5ED"/><ellipse cx="205" cy="348" rx="138" ry="23" fill="#CFC7B6" opacity=".23"/><path d="M57 313 V329 C57 355 343 355 343 329 V313" fill="#D9D9C8"/><ellipse cx="200" cy="313" rx="143" ry="38" fill="#E8EBDB"/><ellipse cx="200" cy="311" rx="119" ry="27" fill="#F3F3E8"/><ellipse cx="204" cy="310" rx="81" ry="13" fill="#838A73" opacity=".17"/><g filter="url(#shadow)">{subject}</g></svg>'
def animal(s,k):
 e,c,p,l,r=s.ellipse,s.circle,s.path,s.line,s.rect
 color={"dog":"#C08E61","cat":"#DFA569","rabbit":"#F5F0E4","bear":"#AB784D","lion":"#E8B35C","elephant":"#A3B5C0","giraffe":"#EBBA65","monkey":"#AA7D56","duck":"#F4D76B","pig":"#E9A5AF","cow":"#F8F3E8","horse":"#AD7C53"}[k]
 z=""
 if k=="duck":
    z+=e(197,258,72,48,color)+e(185,252,35,28,"#E6C55F")
    z+=c(236,191,42,color)+e(276,207,26,12,"#E59E47")+c(250,183,5,"#343B3E")
    z+=e(173,304,23,8,"#E59E47")+e(230,304,23,8,"#E59E47")
    z+=p("M130 263 Q95 242 112 233 L151 249",color)
    return z
 if k=="giraffe":
    z+=r(148,226,88,73,color,26)+r(198,138,32,113,color,13)
    z+=e(220,125,46,33,color)+e(249,139,30,22,"#F2D7A0")
    z+=r(153,274,22,39,color,9)+r(215,274,22,39,color,9)
    z+=l("M202 99 L197 78 M227 95 L231 75","#9D754D",8)
    z+=c(195,77,7,"#9D754D")+c(232,74,7,"#9D754D")
    z+=e(184,106,17,9,color)+e(249,99,15,9,color)+c(235,119,5,"#343B3E")
    for x,y,rx,ry in [(174,246,10,12),(216,232,8,10),(193,273,9,10),(214,192,8,10),(212,159,7,10)]:z+=e(x,y,rx,ry,"#BD874E")
    z+=l("M151 248 Q124 250 127 272","#B8884C",5)
    return z
 if k=="elephant":
    z+=e(196,253,77,57,color)+r(139,267,29,45,color,12)+r(210,267,30,45,color,12)
    z+=e(140,184,48,59,"#99ABB9")+e(241,184,48,59,"#99ABB9")
    z+=e(144,184,30,40,"#BAC7CB")+e(239,184,29,40,"#BAC7CB")
    z+=e(192,185,65,64,color)+s.face(192,175,.95,False)
    z+=p("M178 207 Q170 282 206 274 Q234 275 233 248 Q218 272 209 247 L207 210 Z",color)
    z+=l("M187 231 L201 233 M189 247 L204 247","#809AA9",2)
    return z
 if k=="horse":
    z+=e(184,253,75,42,color)+r(137,265,21,49,color,7)+r(211,265,21,49,color,7)
    z+=p("M211 251 L220 155 Q236 142 250 160 L264 253Z",color)
    z+=e(237,157,38,45,color)+e(263,180,28,19,"#DFB995")
    z+=p("M205 148 Q212 109 235 114 L249 146 Q221 141 219 224 L204 231 Z","#73503D")
    z+=p("M227 123 L225 91 Q251 97 246 124",color)+c(247,150,5,"#343B3E")
    z+=l("M114 247 Q87 222 91 265","#73503D",12)
    return z
 if k=="monkey": z+=l("M145 267 Q90 306 85 260 Q80 227 107 224","#936847",15)
 if k=="cat": z+=l("M250 283 Q300 281 286 224","#CB8C53",16)
 z+=e(200,252,54,61,color)+e(200,264,31,39,shade(color,1.36))
 z+=e(157,249,20,36,color)+e(243,249,20,36,color)
 z+=e(164,304,31,13,color)+e(236,304,31,13,color)
 if k=="rabbit":
    z+=e(167,102,20,61,color, 'transform="rotate(-12 167 102)"')+e(227,102,20,61,color,'transform="rotate(10 227 102)"')
    z+=e(167,100,10,44,"#E7ADB3",'transform="rotate(-12 167 100)"')+e(227,100,10,44,"#E7ADB3",'transform="rotate(10 227 100)"')
 elif k in ["bear","monkey","pig","cow","lion"]:
    if k=="lion":
        z+=e(200,175,89,78,"#B8763D")
        for i in range(12):
            a=i*math.pi/6;z+=c(round(200+69*math.cos(a),1),round(175+60*math.sin(a),1),22,"#C78842")
    else:
        z+=c(145,133,25,color)+c(255,133,25,color)
        z+=c(145,133,14,"#E4B5A6")+c(255,133,14,"#E4B5A6")
    if k=="cow":
        z+=p("M156 131 Q134 93 157 102 L180 136","#D7BD82")+p("M227 128 Q253 88 251 114 L244 138","#D7BD82")
 elif k=="dog": z+=e(143,181,28,60,"#886347",'transform="rotate(13 143 181)"')+e(257,181,28,60,"#886347",'transform="rotate(-13 257 181)"')
 elif k=="cat":
    z+=p("M139 161 L134 102 Q168 101 183 144",color)+p("M218 145 Q243 105 266 102 L263 168",color)
    z+=p("M148 144 L146 120 L174 147","#E9B3A3")+p("M230 146 L256 120 L253 151","#E9B3A3")
 z+=e(200,183,69,60,color)
 if k=="monkey":
    z+=e(182,181,30,35,"#E8CBA4")+e(218,181,30,35,"#E8CBA4")+e(200,208,45,30,"#E8CBA4")
 if k=="cow":
    z+=e(167,164,22,26,"#696F70")+e(228,246,19,23,"#696F70")
 if k in ["dog","bear","lion","cat"]:z+=e(200,206,30,21,"#F3DEC0" if k!="cat" else "#F6E4CC")
 if k in ["pig","cow"]:
    z+=s.face(200,174,1,False)+e(200,210,34,23,"#E3A6AA")+e(188,211,4,6,"#BA7680")+e(212,211,4,6,"#BA7680")
 else: z+=s.face(200,174)
 if k=="cat":
    z+=l("M170 205 L140 200 M169 214 L138 217 M230 205 L260 200 M232 214 L261 217","#91704F",2.5)
    z+=l("M187 135 L194 151 M209 135 L207 151","#B97846",5)
 return z
def produce(s,k):
 e,c,p,l,r=s.ellipse,s.circle,s.path,s.line,s.rect
 z=""
 if k in ["apple","peach","tomato"]:
    col={"apple":"#DC6B57","peach":"#EBA597","tomato":"#E96D4D"}[k]
    z+=p("M199 148 C117 112  ninety 220 139 284 Q159 314 200 301 Q246 316 271 274 C309 205 278 112 199 148".replace(" ninety","98"),col)
    if k=="peach": z+=l("M207 156 Q185 220 209 291","#D58279",3)
    z+=l("M200 153 Q201 126 214 118","#887052",9)+s.leaf(204,141,.72,65)
    if k=="tomato":
        z+=p("M201 135 L213 116 L217 136 L244 131 L229 149 L246 165 L216 158 L198 179 L192 154 L164 152 L185 140 L179 120Z","#699B5B")
 elif k in ["mandarin","pear"]:
    col="#EDAD51" if k=="mandarin" else "#D5B37C"
    z+=e(200,231,81,77,col)+l("M201 155 L199 137","#8B734F",7)+s.leaf(203,157,.7,70)
    if k=="pear":
        for x,y in [(161,202),(221,181),(245,232),(195,279),(152,252),(224,258),(184,176)]:
            z+=c(x,y,2.3,"#B18D5E")
 elif k=="banana":
    z+=p("M116 147 C124 238 204 273 283 183 Q275 277 207 306 Q128 318 101 235 Q85 189 103 147Z","#EFCC54")
    z+=p("M122 158 C144 242 201 243 267 193 Q222 276 171 271 Q122 251 111 196Z","#F7DF7E")
    z+=p("M101 149 L105 125 L122 128 L118 155Z","#8A8060")+p("M274 191 L283 174 L292 180 L284 201Z","#9D8655")
 elif k=="strawberry":
    z+=p("M200 137 C91 109 118 242 187 304 Q199 317 213 302 C286 240 309 113 200 137Z","#DC655B")
    z+=p("M199 154 L167 124 L183 126 L193 104 L207 128 L238 115 L226 144 L254 154 L216 165 L196 187 L185 160 L155 160Z","#78A568")
    for x,y in [(157,178),(187,204),(224,181),(249,201),(164,225),(211,246),(195,281),(237,235)]:
        z+=e(x,y,3,5,"#F1D4A1")
 elif k=="grape":
    z+=l("M194 137 Q188 104 214 97","#8A7354",9)+s.leaf(199,130,1,65)
    for x,y in [(172,156),(210,159),(149,190),(186,193),(227,194),(160,228),(205,231),(183,268),(193,294)]:
        z+=c(x,y,27,"#9B87B4")
 elif k=="watermelon":
    z+=p("M100 170 Q106 320 280 305 L285 144Z","#72A16D")
    z+=p("M111 172 Q122 295 271 295 L276 160Z","#D9DDA4")
    z+=p("M125 180 Q137 275 258 281 L267 177Z","#E3776D")
    for x,y,a in [(150,201,-25),(169,236,-35),(213,252,5),(238,210,20)]:
        z+=e(x,y,3.8,7,"#675647",f'transform="rotate({a} {x} {y})"')
 elif k=="carrot":
    z+=p("M187 167 Q217 157 244 193 L174 305 Q164 322 161 300 L152 197 Q155 176 187 167Z","#EC9B54")
    z+=l("M170 215 L191 222 M166 244 L181 251 M181 277 L195 274","#CF7D3E",3)
    for dx,rot in [(182,-22),(198,10),(211,38)]:z+=s.leaf(dx,177,1.1,rot)
 elif k=="corn":
    z+=e(203,215,45,98,"#E9CB65")
    for row in range(9):
        for col in range(4):
            z+=e(177+col*17,149+row*17,7,7,"#F4D782")
    z+=p("M193 313 Q108 279 140 198 Q154 267 193 278Z","#77A96D")
    z+=p("M203 312 Q263 310 280 188 Q239 206 234 261Z","#6E9C5E")
 elif k in ["sweetpotato","potato"]:
    col="#A66C83" if k=="sweetpotato" else "#C3A27B"
    z+=e(185,239,76,45,col,'transform="rotate(-28 185 239)"')
    if k=="sweetpotato":
        z+=e(247,272,47,28,"#A96A7E",'transform="rotate(-28 247 272)"')
        z+=e(233,259,39,27,"#F1D99A",'transform="rotate(-28 233 259)"')
    for x,y in [(142,246),(173,219),(205,244)]: z+=l(f"M{x} {y} l5 -3",shade(col,.72),3)
 elif k=="broccoli":
    z+=p("M178 211 L218 207 L223 306 Q198 318 176 307 L184 256 L166 236Z","#A5BF78")
    for x,y,rad in [(147,199,39),(195,157,46),(244,193,42),(192,209,41),(168,166,32)]: z+=c(x,y,rad,"#79A275")
    z+=l("M190 302 L192 247 M202 302 L208 254","#7D9D63",3)
 elif k in ["cucumber","eggplant"]:
    col="#79A273" if k=="cucumber" else "#9175A9"
    z+=e(195,234,40,86,col,'transform="rotate(26 195 234)"')
    z+=p("M209 161 L224 133 L235 148 L257 155 L233 173 L220 191 L217 168Z","#69935E")
    if k=="cucumber":
        for x,y in [(180,232),(207,204),(169,259),(218,227),(193,275)]:z+=c(x,y,2.3,"#527B4D")
 elif k=="pumpkin":
    for x,rx in [(155,39),(243,39),(178,47),(222,47),(201,38)]:z+=e(x,233,rx,73,"#DEA05A")
    z+=p("M188 166 L189 139 Q202 124 218 141 L212 166Z","#7D9770")
 elif k=="cabbage":
    z+=e(200,225,71,87,"#9CB88C")
    for x,y,rx,ry,col in [(166,230,33,68,"#80A676"),(233,230,32,67,"#86AC7E"),(187,229,32,80,"#ADC898"),(214,230,25,70,"#B4CC9D")]:
        z+=e(x,y,rx,ry,col)+l(f"M{x} 295 Q{x-9} {y+10} {x} {y-45}","#D8DDBA",4)
 else: raise ValueError(k)
 return z
def vehicle(s,k):
 e,c,p,l,r=s.ellipse,s.circle,s.path,s.line,s.rect
 wheel=lambda x,y,rad=22:c(x,y,rad,"#626D70")+c(x,y,rad*.51,"#B9C6C5")+c(x-2,y-2,rad*.17,"#E7EBE3")
 if k=="bicycle":
    z=wheel(125,269,44)+wheel(277,269,44)
    z+=l("M125 269 L170 204 L213 269 Z M170 204 L242 204 L213 269 M242 204 L277 269 M242 204 L231 175 L251 175","#7EAAAA",10)
    z+=l("M170 204 L166 187 M151 186 L183 186","#786854",8)+c(213,269,10,"#DFC181")+l("M213 269 L225 280","#6E7777",5)
    return z
 if k=="airplane":
    return p("M85 239 L181 199 L203 117 Q214 103 229 111 L221 192 L305 231 L316 252 L216 227 L207 284 L232 301 L230 314 L194 299 L164 305 L159 294 L182 277 L179 230 L85 254Z","#94B7CA")+e(202,168,14,35,"#D3E1E5")+p("M191 196 L202 113 Q214 95 225 112 L210 240 Q205 279 193 287 L188 228Z","#D9E4E4")+e(212,138,7,12,"#7196AD")
 if k=="boat":
    return e(200,302,120,21,"#B9D7D9")+p("M96 249 L301 249 L267 294 Q178 319 121 285Z","#DB8C6C")+r(152,207,98,44,"#F3E6C6",6)+r(168,188,74,24,"#83A6B3",6)+l("M213 188 L213 104","#9F8E76",7)+p("M205 112 L120 201 L205 201Z","#F1DEC4")+p("M223 117 L223 187 L279 187Z","#88ADB7")+c(151,267,9,"#EFEBD8")+c(192,275,9,"#EFEBD8")+c(235,270,9,"#EFEBD8")
 colors={"car":"#DF8B78","bus":"#DAB664","firetruck":"#D96F60","ambulance":"#E8E9DD","policecar":"#E1E7E5","taxi":"#E7BF65","truck":"#8FB2AC","tractor":"#9BAB6E","train":"#93AEBB"}
 col=colors[k];z=""
 if k=="tractor":
    z+=r(153,214,132,59,col,12)+r(130,155,92,104,col,13)+r(143,169,60,45,"#BBD4D7",8)
    z+=r(121,146,111,15,col,6)+l("M260 220 L260 173","#6D7971",10)
    z+=wheel(153,282,38)+wheel(271,287,24)+r(233,233,39,22,"#CAD4B1",4)
    return z
 if k=="train":
    z+=r(110,182,190,99,col,20)+r(130,130,91,139,col,20)+r(143,148,63,50,"#D6E4E2",12)
    z+=r(245,158,26,42,"#688896",5)+r(239,151,37,13,"#688896",5)+p("M117 264 L92 296 L300 296 L294 269Z","#D99C73")
    for x in [144,208,271]:z+=wheel(x,286,23)
    z+=r(231,220,60,14,"#DCE7DF",5)
    return z
 # Soft side/front three-quarter toy automobile
 z+=p("M89 237 L112 216 L296 216 L315 241 L304 280 L106 282Z",shade(col,.88))
 if k in ["bus","truck","ambulance"]:
    z+=r(104,153,178,119,col,20)+p("M282 160 L306 183 L306 260 L282 274Z",shade(col,.86))
    if k=="truck":
        z+=r(97,159,115,104,col,13)+r(216,202,84,70,"#DDC199",13)+r(226,213,45,31,"#BFD6DA",6)
    else:
        z+=r(117,167,151,47,"#B7D1D6",8)
        if k=="bus":
            z+=l("M154 170 L154 212 M190 170 L190 212 M227 170 L227 212",shade(col,.8),5)
        else: z+=r(171,227,34,9,"#DF8D76",2)+r(184,215,9,33,"#DF8D76",2)
 else:
    z+=p("M137 218 L161 163 Q171 151 187 152 L237 152 Q253 153 264 180 L280 218Z",col)
    z+=p("M149 214 L174 167 L200 167 L200 214Z","#BED7DB")+p("M210 167 L237 167 L257 213 L210 213Z","#BED7DB")
    z+=r(99,216,198,62,col,16)+p("M299 216 L318 232 L312 269 L296 278Z",shade(col,.83))
 if k in ["policecar","ambulance","firetruck"]:
    z+=r(176,143,25,11,"#D98174",3)+r(201,143,25,11,"#7699B7",3)
 if k=="policecar": z+=r(109,239,173,14,"#627E91",2)
 if k=="taxi": z+=r(184,139,37,17,"#E4C373",5)
 if k=="firetruck":
    z+=r(111,191,179,15,"#DCD4BE",3)+l("M121 186 L269 157 M126 196 L278 166","#B3BEB7",5)
    for x in range(135,263,25):z+=l(f"M{x} 184 l-2 -12","#B3BEB7",4)
 z+=wheel(147,276)+wheel(258,276)+r(110,234,20,10,"#F0E5B7",4)+r(281,236,10,12,"#EDD1A2",3)
 return z
def food(s,k):
 e,c,p,l,r=s.ellipse,s.circle,s.path,s.line,s.rect
 z=""
 if k in ["rice","noodles","soup"]:
    z+=p("M119 225 Q122 311 201 313 Q278 307 285 225Z","#E7DFCA")+e(202,224,83,31,"#C4B7A1")
    if k=="rice":
        z+=e(201,213,73,38,"#F5F1DE")
        for x,y,a in [(152,208,-20),(178,191,20),(201,214,-15),(225,196,25),(244,213,-25),(177,231,0),(223,233,-15)]:
            z+=e(x,y,9,4,"#FFF9E9",f'transform="rotate({a} {x} {y})"')
    elif k=="soup":
        z+=e(202,224,71,23,"#D8B56F")
        for x,y in [(163,219),(210,211),(241,229)]:z+=r(x,y,15,10,"#DFA277",3)
        z+=s.leaf(186,231,.32,80)+s.leaf(222,240,.32,-40)
        z+=l("M167 167 Q151 151 168 134 M203 161 Q187 140 205 121 M238 174 Q225 157 241 140","#DBD8C9",5)
    else:
        z+=e(202,224,73,24,"#D6B780")
        for i in range(5):
            z+=l(f"M{150+i*20} 225 Q{128+i*20} 202 {168+i*17} 207 Q{184+i*12} 213 {173+i*20} 231","#F2DB9E",6)
        z+=l("M214 191 L280 123 M227 195 L294 126","#947152",6)
        z+=e(240,224,20,13,"#F9F0CF")+c(241,223,9,"#E6BD62")
    z+=l("M136 259 Q202 284 267 258","#F8F2E5",3)
 elif k=="bread":
    z+=p("M124 199 Q106 168 125 146 Q149 126 177 142 Q208 125 238 141 Q275 160 257 196 L255 295 Q199 313 128 290Z","#BF8D59")
    z+=p("M145 201 Q123 180 141 162 Q156 148 180 161 Q208 144 233 165 Q253 181 239 200 L236 281 Q195 294 148 278Z","#F1D6A4")
 elif k in ["milk","water"]:
    z+=p("M142 140 L263 140 L249 294 Q204 319 153 294Z","#C8DDDF")
    z+=p("M153 174 L251 174 L240 286 Q203 302 163 287Z","#F5F1DB" if k=="milk" else "#9AC7D5")
    z+=e(202,174,48,13,"#FAF5E5" if k=="milk" else "#BFDFE3")+e(202,140,61,17,"#D3E3E3")
    z+=e(202,140,49,11,"#B5CFD2")+l("M160 158 L170 270","#F3F5ED",5)
 elif k=="egg":
    z+=e(184,232,61,79,"#EDE2C6")
    z+=e(244,278,45,29,"#F6F0DC", 'transform="rotate(-13 244 278)"')+e(244,277,23,20,"#E8BB64")
 elif k=="cheese":
    z+=p("M119 235 L221 151 L286 231 L286 293 L119 298Z","#DBB450")+p("M119 235 L221 151 L286 231Z","#EFCE76")
    z+=p("M119 235 L286 231 L286 293 L119 298Z","#E6C264")
    for x,y,rx,ry in [(160,260,11,8),(214,282,10,7),(253,252,12,9),(216,201,11,6)]:z+=e(x,y,rx,ry,"#B99949")
 elif k in ["ricecake","dumpling"]:
    z+=e(201,284,107,29,"#BCD0CB")+e(201,278,96,23,"#E6E8D9")
    if k=="ricecake":
        for x,y,a in [(163,246,-25),(213,248,24),(205,221,-19)]:
            z+=r(x-33,y-17,66,35,"#F4EDDA",16,f'transform="rotate({a} {x} {y})"')
    else:
        for x,y,sc in [(164,246,1),(238,251,.95),(204,208,.88)]:
            z+=f'<g transform="translate({x} {y}) scale({sc})">'+p("M-44 17 Q-38 -43 0 -34 Q38 -35 44 17 Q0 40 -44 17Z","#EEDCB4")
            for dx in [-24,-12,0,12,24]:z+=l(f"M{dx} -24 Q{dx-5} -5 {dx+5} 6","#D5BE96",3)
            z+="</g>"
 return z
def character(s,k):
 e,c,p,l,r=s.ellipse,s.circle,s.path,s.line,s.rect
 if k=="rody":
    z=r(162,195,78,78,"#E8C064",18)+r(139,132,126,76,"#E7C15F",18)+r(152,145,100,41,"#769CAD",12)
    z+=e(180,165,5,8,"#F8F4DB")+e(221,165,5,8,"#F8F4DB")+l("M187 187 L215 187","#5D7582",3)
    z+=r(169,214,64,37,"#9EBDC6",7)+c(188,231,5,"#E6977A")+c(214,231,5,"#E6977A")
    z+=l("M154 222 L128 261 M245 222 L270 253","#D5AF56",18)+c(127,268,14,"#819FAB")+c(274,260,14,"#819FAB")
    z+=r(163,267,27,32,"#D5B15E",8)+r(216,267,27,32,"#D5B15E",8)+r(149,294,46,20,"#7C9FAC",8)+r(212,294,46,20,"#7C9FAC",8)
    z+=l("M199 130 L199 106","#819FAB",5)+c(199,101,9,"#DE927B")
    return z
 if k in ["pororo","petty"]:
    blue="#76A7C4"
    z=e(200,250,57,62,blue)+e(200,259,39,43,"#EFEBD9")+e(149,249,18,40,blue,'transform="rotate(18 149 249)"')+e(251,249,18,40,blue,'transform="rotate(-18 251 249)"')
    z+=e(170,309,30,12,"#DFB65B")+e(231,309,30,12,"#DFB65B")+c(200,171,66,blue)
    z+=e(177,174,29,36,"#F4EEDB")+e(222,174,29,36,"#F4EEDB")+e(200,199,30,15,"#E0AE54")
    if k=="pororo":
        z+=p("M133 150 Q128  eighty 201 88 Q274 90 269 151Z".replace(" eighty","90"),"#E7C260")
        z+=r(125,137,152,17,"#E5BD58",8)+l("M150 119 Q193 86 237 118","#F4DA8A",5)
        z+=c(172,165,24,"#CB8B65")+c(228,165,24,"#CB8B65")+c(172,165,18,"#D4E8E8")+c(228,165,18,"#D4E8E8")+l("M197 164 L203 164","#B27954",5)
        z+=e(174,168,4,7,"#354A54")+e(225,168,4,7,"#354A54")
        z+=p("M160 228 Q200 245 240 228 L226 242 L243 260 L220 257 L206 241 L170 240Z","#DE9C7B")
    else:
        z+=p("M135 147 Q132 80 203 91 Q262 91 269 150 Q246 133 225 137 Q171 124 135 147Z","#A390B5")
        z+=c(220, ninety:=94,11,"#B3A0C2")
        z+=s.face(200,173,.85,False)+l("M173 169 l-7 -5 M222 169 l7 -5","#526A7C",2)
    return z
 if k=="harry":
    z=e(200,257,52, fifty:=52,"#EDCD62")+c(202,177,58,"#EBCB60")
    z+=e(154,252,20,36,"#E2BC57",'transform="rotate(28 154 252)"')+e(247,253,20,36,"#E2BC57",'transform="rotate(-28 247 253)"')
    z+=e(176,308,25,9,"#D7994F")+e(226,308,25,9,"#D7994F")+e(201,196,25,12,"#D79A4C")+s.face(202,168,.85,False)
    z+=p("M176 125 Q158 98 172 91 L194 119 Q177 85 195 88 L211 119 Q213 91 225 101 L224 135Z","#78A1B7")
    return z
 if k=="crong":
    col="#83A575";z=e(197,251,56,61,col)+e(203,259,34,42,"#CFD499")
    z+=p("M151 263 Q94 298 109 237 L165 261",col)+e(145,252,21,33,col)+e(249,252,20,35,col)+e(169,309,27,11,col)+e(230,309,27,11,col)
    z+=e(196,170,66,56,col)+c(168,127,26,col)+c(225,127,26,col)+s.face(196,141,1.2,False)+e(203,190, sixty:=64,32,"#9BBF83")
    z+=c(180,186,3,"#627F58")+c(222,186,3,"#627F58")+l("M164 205 Q204 226 246 202","#5E7C53",3)
    z+=p("M165 210 L173 222 L180 214Z","#F3EDD4")+p("M224 215 L232 224 L237 209Z","#F3EDD4")
    return z
 col={"loopy":"#DDA1AD","eddy":"#DEA46E","poby":"#EEECDD"}[k]
 z=e(200,252,56,61,col)+e(149,250,20,35,col)+e(251,250,20,35,col)+e(169,310,27,11,col)+e(231,310,27,11,col)
 if k=="eddy":
    z+=p("M132 157 L133 91 L182 137Z",col)+p("M220 136 L267 91 L267 164Z",col)+p("M145 141 L144 116 L169 142Z","#EFE1BE")+p("M235 141 L256 114 L253 145Z","#EFE1BE")
    z+=e(200,171,70,56,col)+p("M137 177 Q157 234 201 230 Q252 230 266 178 L218 199 L200 218 L184 199Z","#F0E1BE")
    z+=r(166,235,68,61,"#96AF8A",12)+s.face(200,169)
 elif k=="loopy":
    z+=c(147,132,25,col)+c(253,132,25,col)+c(147,132,14,"#C88C99")+c(253,132,14,"#C88C99")
    z+=e(200,181,72,64,col)+s.face(200,168,1,False)+e(200,202,14,10,"#B97180")
    z+=p("M187 219 L213 219 L210 235 L190 235Z","#F9F0DB")+l("M200 219 L200 234","#CFC5B2",2)+e(159,196,12,6,"#EFC0C0")+e(241,196,12,6,"#EFC0C0")
 elif k=="poby":
    z+=c(149,127,25,col)+c(251,127,25,col)+c(149,127,13,"#D7CFBC")+c(251,127,13,"#D7CFBC")
    z+=e(200,178,70,65,col)+e(200,199,31,25,"#E4E0CB")+s.face(200,167)
    z+=r(167,251,66,44,"#92AFBD",12)+r(167,235,14,35,"#92AFBD",5)+r(219,235,14,35,"#92AFBD",5)
 return z
d=json.loads((ROOT/"content.json").read_text())
for w in d["words"]:
 s=Scene()
 if w["category"]=="animals": z=animal(s,w["id"])
 elif w["category"] in ["fruit","vegetables"]:z=produce(s,w["id"])
 elif w["category"]=="vehicles":z=vehicle(s,w["id"])
 elif w["category"]=="food":z=food(s,w["id"])
 else:z=character(s,w["id"])
 text=s.wrap(z,w["label"])
 (OUT/f'{w["id"]}.svg').write_text(text,encoding="utf-8")
 w["art"]=f'assets/cards/{w["id"]}.svg'
(ROOT/"content.json").write_text(json.dumps(d,ensure_ascii=False,indent=2),encoding="utf-8")
print("Created",len(d["words"]),"self-contained vector dioramas.")

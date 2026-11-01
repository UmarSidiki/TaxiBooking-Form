# Source of truth for palette tokens. Run: python3 scripts/gen-riviera-palettes.py src/shared/style/riviera-palettes.css
import sys
def L(**k): return k
PAL={
"neutral":{
 "light":L(paper="#FFFFFF",sheet="#FFFFFF",well="#F5F5F5",ink="#171717",ink2="#5C5C5C",rule="#E5E5E5",rule2="#8F8F8F",sig="#171717",sig_on="#FFFFFF",sig_tint="#F5F5F5",link="#1D4ED8",info="#1D4ED8",ok="#15803D",warn="#A14A06",err="#B91C1C",ok_tint="#EEF8F1",warn_tint="#FDF4EA",err_tint="#FDF0F0",info_tint="#EFF4FD",sidebar="#FAFAFA",dock="rgb(255 255 255 / 0.72)"),
 "dark":L(paper="#111111",sheet="#1A1A1A",well="#242424",ink="#EDEDED",ink2="#A8A8A8",rule="#2E2E2E",rule2="#707070",sig="#EDEDED",sig_on="#111111",sig_tint="#262626",link="#7DB4FB",info="#7DB4FB",ok="#5FD68E",warn="#F5B94A",err="#F88A8A",ok_tint="#14261B",warn_tint="#2A2112",err_tint="#2C1717",info_tint="#15203A",sidebar="#1A1A1A",dock="rgb(26 26 26 / 0.68)")},
"slate":{
 "light":L(paper="#F6F7F9",sheet="#FFFFFF",well="#EEF0F4",ink="#161A23",ink2="#535B6D",rule="#DFE3EA",rule2="#858DA0",sig="#4652D6",sig_on="#FFFFFF",sig_tint="#EEF0FD",link="#3B47C9",info="#3B47C9",ok="#1A7F4B",warn="#975600",err="#C2333B",ok_tint="#ECF7F1",warn_tint="#FBF3E6",err_tint="#FCEFF0",info_tint="#EEF0FD",sidebar="#F6F7F9",dock="rgb(255 255 255 / 0.74)"),
 "dark":L(paper="#0E1016",sheet="#171A22",well="#20242E",ink="#ECEEF3",ink2="#A3ABBC",rule="#2A2F3B",rule2="#687088",sig="#8B93F5",sig_on="#0E1016",sig_tint="#232849",link="#9EA5F7",info="#9EA5F7",ok="#4CC98A",warn="#E6A846",err="#F07178",ok_tint="#13261D",warn_tint="#2A2214",err_tint="#2C171B",info_tint="#1E2242",sidebar="#171A22",dock="rgb(23 26 34 / 0.70)")},
"heritage":{
 "light":L(paper="#F8F5F0",sheet="#FFFFFF",well="#F1ECE4",ink="#1E1916",ink2="#625951",rule="#E6DFD5",rule2="#958A7E",sig="#8E1B2B",sig_on="#FFFFFF",sig_tint="#F8ECEC",link="#7A5A22",info="#2F5C8A",ok="#2F7A4A",warn="#8F560A",err="#B3261E",ok_tint="#EEF6F0",warn_tint="#FAF2E4",err_tint="#FBEEED",info_tint="#EDF2F8",sidebar="#F8F5F0",dock="rgb(255 255 255 / 0.74)"),
 "dark":L(paper="#14110F",sheet="#1E1A17",well="#28231F",ink="#F3EEE7",ink2="#B3A89E",rule="#352E29",rule2="#7A6E64",sig="#E0737F",sig_on="#14110F",sig_tint="#3A2024",link="#D2B07A",info="#8FB6E0",ok="#6CC28E",warn="#E5AE5C",err="#F2837A",ok_tint="#172519",warn_tint="#2B2214",err_tint="#2F1A18",info_tint="#18222E",sidebar="#1E1A17",dock="rgb(30 26 23 / 0.70)")},
"navy":{
 "light":L(paper="#F6F9FC",sheet="#FFFFFF",well="#EDF2F7",ink="#0A2540",ink2="#4A5C74",rule="#DCE3EC",rule2="#7C8CA3",sig="#533AFD",sig_on="#FFFFFF",sig_tint="#EFECFF",link="#0064C8",info="#0064C8",ok="#0E7C55",warn="#985700",err="#BE2F57",ok_tint="#EAF6F1",warn_tint="#FBF3E5",err_tint="#FCEEF2",info_tint="#EAF3FC",sidebar="#F6F9FC",dock="rgb(255 255 255 / 0.74)"),
 "dark":L(paper="#071A2F",sheet="#0E2540",well="#15304F",ink="#EAF1F8",ink2="#A4B6CC",rule="#1F3A5A",rule2="#5C7898",sig="#9A8CFF",sig_on="#071A2F",sig_tint="#24305E",link="#6CB8FF",info="#6CB8FF",ok="#3FD39A",warn="#F2B553",err="#FF8AA6",ok_tint="#0D3036",warn_tint="#2A2E2C",err_tint="#2E2440",info_tint="#133556",sidebar="#0E2540",dock="rgb(14 37 64 / 0.72)")},
}
# Logo plate behind uploaded brand images. Light surfaces match the sheet; dark
# mode keeps a light plate so dark wordmarks stay readable without hardcoding a
# colour in the component. The text plate uses --logo-ink: the palette ink on a
# light plate in both modes, so the brand name stays legible on dark surfaces.
LOGO_PLATE_DARK={"neutral":"#F4F4F4","slate":"#F3F4F7","heritage":"#F6F1EA","navy":"#EEF3F8"}
for _pid,_pal in PAL.items():
    _pal["light"]["logo_plate"]=_pal["light"]["sheet"]
    _pal["dark"]["logo_plate"]=LOGO_PLATE_DARK[_pid]
    _pal["light"]["logo_ink"]=_pal["light"]["ink"]
    _pal["dark"]["logo_ink"]=_pal["light"]["ink"]
def lum(h):
  c=[int(h[i:i+2],16)/255 for i in (1,3,5)]
  c=[x/12.92 if x<=.03928 else ((x+.055)/1.055)**2.4 for x in c]
  return .2126*c[0]+.7152*c[1]+.0722*c[2]
def cr(a,b):
  x,y=sorted([lum(a),lum(b)],reverse=True); return (x+.05)/(y+.05)
TEXT=[("ink",s) for s in ("paper","sheet","well")]+[("ink2",s) for s in ("paper","sheet","well")]+[("sig_on","sig"),("link","sheet"),("link","paper"),("ink","sig_tint")]+[(t,t+"_tint") for t in ("ok","warn","err","info")]+[(t,"sheet") for t in ("ok","warn","err","info")]
UI=[("rule2","sheet"),("rule2","paper"),("sig","sheet"),("sig","paper")]
fails=0
for p,m in PAL.items():
  for mode,t in m.items():
    for a,b in TEXT:
      v=cr(t[a],t[b])
      if v<4.5: print("TEXT",p,mode,a,b,round(v,2)); fails+=1
    for a,b in UI:
      v=cr(t[a],t[b])
      if v<3: print("UI",p,mode,a,b,round(v,2)); fails+=1
print("fails",fails)
def block(sel,t):
  return sel+" {\n"+"".join(f"  --{k.replace('_','-')}: {v};\n" for k,v in t.items())+"}\n"
out=["/* Generated palette tokens. One block per palette and mode; components read only these variables.\n   Neutral is the default. Light/dark follows data-riviera-theme, the palette follows data-palette on <html>. */\n"]
for p,m in PAL.items():
  lroot=f':root[data-palette="{p}"]:not([data-riviera-theme="dark"])' if p!="neutral" else ':root:not([data-riviera-theme="dark"])'
  droot=f':root[data-palette="{p}"][data-riviera-theme="dark"]' if p!="neutral" else ':root[data-riviera-theme="dark"]'
  light=f'{lroot},\n{lroot} .riviera,\n{lroot} .riviera-embed'+f',\n:root:not([data-riviera-theme="dark"]) .riviera [data-palette-scope="{p}"]'
  dark=f'{droot},\n{droot} .riviera,\n{droot} .riviera-embed'+f',\n:root[data-riviera-theme="dark"] .riviera [data-palette-scope="{p}"]'
  lt=dict(m["light"]); lt["sig"]=f'var(--operator-accent, {lt["sig"]})'
  out.append(block(light,lt)); out.append(block(dark,m["dark"]))
out.append("/* The page itself paints the palette, so nothing flashes between streamed chunks and hydration. */\n:root body {\n  background: var(--paper);\n  color: var(--ink);\n}\n")
if len(sys.argv)>1: open(sys.argv[1],"w").write("\n".join(out))

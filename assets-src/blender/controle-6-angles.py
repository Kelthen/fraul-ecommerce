import bpy, sys, math
a=sys.argv[sys.argv.index("--")+1:]; SRC,OUT=a[0],a[1]; ZOOM=a[2] if len(a)>2 else None
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
sc=bpy.context.scene
COL={"Mannequin_Blanc_Laque":(0.85,0.82,0.75),"Tee_Noir":(0.45,0.02,0.04),"Jean_Noir_Delave":(0.08,0.15,0.4),"Basket_Blanc":(0.95,0.95,0.95),"Socle_Metal_Brosse":(0.4,0.4,0.4)}
for m in bpy.data.materials:
    k=next((k for k in COL if m.name.startswith(k)),None)
    if k and m.use_nodes:
        p=m.node_tree.nodes.get("Principled BSDF")
        if p: p.inputs["Base Color"].default_value=(*COL[k],1); p.inputs["Metallic"].default_value=0; p.inputs["Roughness"].default_value=0.6
objs=[o for o in sc.objects if o.type=="MESH"]
root0=bpy.data.objects.new("r0",None); sc.collection.objects.link(root0)
for o in objs:
    mw=o.matrix_world.copy(); o.parent=root0; o.matrix_world=mw
roots=[root0]
for j in range(1,6):
    r=bpy.data.objects.new("r",None); sc.collection.objects.link(r)
    for o in objs:
        c=o.copy(); sc.collection.objects.link(c); c.parent=r
    roots.append(r)
for j,r in enumerate(roots):
    r.rotation_euler.z=math.radians(60*j); r.location.x=(j-2.5)*0.85
sc.render.engine="CYCLES"; sc.cycles.samples=12
sc.render.resolution_x,sc.render.resolution_y=(1800,700)
sc.world=bpy.data.worlds.new("w"); sc.world.color=(0.5,0.5,0.5)
cam=bpy.data.objects.new("c",bpy.data.cameras.new("c")); sc.collection.objects.link(cam); sc.camera=cam
cam.data.type="ORTHO"; cam.data.ortho_scale=5.2; cam.location=(0,-6,1.0); cam.rotation_euler=(math.radians(90),0,0)
if ZOOM:  # x,z,échelle
    x,z,s=map(float,ZOOM.split(",")); cam.location=(x,-6,z); cam.data.ortho_scale=s
for rot,e in (((60,0,20),3),((70,0,200),1.5)):
    L=bpy.data.objects.new("L",bpy.data.lights.new("L","SUN")); L.data.energy=e; L.rotation_euler=tuple(math.radians(v) for v in rot); sc.collection.objects.link(L)
sc.render.filepath=OUT; bpy.ops.render.render(write_still=True)

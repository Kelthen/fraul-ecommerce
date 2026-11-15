# Textures du mall réaliste fabriquées dans Blender (procédural, rendu « albédo » via émission, sans lumière).
# Lancer : blender -b -P assets-src/blender/textures-mall.py -- <dossier> [noms…]   (ou python avec le module bpy)
# puis convertir en JPEG vers public/textures/mall/ (dalles : 2048 px, les autres : taille actuelle).
import bpy, sys
out = sys.argv[sys.argv.index("--") + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = "CYCLES"; sc.cycles.samples = 16; sc.cycles.device = "CPU"
sc.render.resolution_x = sc.render.resolution_y = 2048
sc.view_settings.view_transform = "Standard"
bpy.ops.mesh.primitive_plane_add(size=2)
plane = bpy.context.object
cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
cam.data.type = "ORTHO"; cam.data.ortho_scale = 2; cam.location = (0, 0, 3)

def material(name, build):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    o = nt.nodes.new("ShaderNodeOutputMaterial"); e = nt.nodes.new("ShaderNodeEmission")
    nt.links.new(e.outputs[0], o.inputs[0]); build(nt, e.inputs[0]); plane.data.materials.clear(); plane.data.materials.append(m)

def ramp(nt, stops):
    r = nt.nodes.new("ShaderNodeValToRGB"); el = r.color_ramp.elements
    for i, (p, c) in enumerate(stops):
        e = el[i] if i < 2 else el.new(p); e.position = p; e.color = (*c, 1)
    return r

def marble(nt, sink):
    n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 1.4; n.inputs["Detail"].default_value = 6; n.inputs["Distortion"].default_value = 0.6
    w = nt.nodes.new("ShaderNodeTexWave"); w.inputs["Scale"].default_value = 1.1; w.inputs["Distortion"].default_value = 3.2; w.inputs["Detail"].default_value = 6; w.inputs["Detail Scale"].default_value = 1.5
    nt.links.new(n.outputs["Fac"], w.inputs["Vector"])
    r = ramp(nt, [(0.0, (0.74, 0.69, 0.62)), (0.025, (0.92, 0.89, 0.84)), (1.0, (0.955, 0.935, 0.895))])
    nt.links.new(w.outputs["Fac"], r.inputs[0]); nt.links.new(r.outputs[0], sink)

def stone(nt, sink):
    n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 60; n.inputs["Detail"].default_value = 15
    r = ramp(nt, [(0.35, (0.88, 0.85, 0.80)), (0.65, (0.94, 0.92, 0.88))])
    nt.links.new(n.outputs["Fac"], r.inputs[0]); nt.links.new(r.outputs[0], sink)

def brushed(nt, sink):
    t = nt.nodes.new("ShaderNodeTexCoord"); m = nt.nodes.new("ShaderNodeMapping"); m.inputs["Scale"].default_value = (1, 120, 1)
    n = nt.nodes.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 8; n.inputs["Detail"].default_value = 15
    nt.links.new(t.outputs["Object"], m.inputs[0]); nt.links.new(m.outputs[0], n.inputs["Vector"])
    r = ramp(nt, [(0.3, (0.68, 0.58, 0.42)), (0.7, (0.86, 0.77, 0.60))])
    nt.links.new(n.outputs["Fac"], r.inputs[0]); nt.links.new(r.outputs[0], sink)

def dalles(nt, sink):
    # Sol du lot 1 (#109) : 4 × 4 grandes dalles de 1,20 m par image (4,80 m), joints fins ; chaque dalle a son propre
    # veinage (décalé et tourné au hasard) pour que la répétition ne se voie plus le long de l'allée.
    N = nt.nodes; L = nt.links.new
    uv = N.new("ShaderNodeTexCoord")
    sc = N.new("ShaderNodeVectorMath"); sc.operation = "SCALE"; sc.inputs["Scale"].default_value = 4; L(uv.outputs["UV"], sc.inputs[0])
    cell = N.new("ShaderNodeVectorMath"); cell.operation = "FLOOR"; L(sc.outputs[0], cell.inputs[0])
    frac = N.new("ShaderNodeVectorMath"); frac.operation = "FRACTION"; L(sc.outputs[0], frac.inputs[0])
    rnd = N.new("ShaderNodeTexWhiteNoise"); rnd.noise_dimensions = "3D"; L(cell.outputs[0], rnd.inputs["Vector"])
    rs = N.new("ShaderNodeSeparateXYZ"); L(rnd.outputs["Color"], rs.inputs[0])
    ang = N.new("ShaderNodeMath"); ang.operation = "MULTIPLY"; ang.inputs[1].default_value = 6.2832; L(rs.outputs[0], ang.inputs[0])
    rot = N.new("ShaderNodeVectorRotate"); rot.rotation_type = "Z_AXIS"; rot.inputs["Center"].default_value = (0.5, 0.5, 0)
    L(frac.outputs[0], rot.inputs["Vector"]); L(ang.outputs[0], rot.inputs["Angle"])
    off = N.new("ShaderNodeVectorMath"); off.operation = "MULTIPLY_ADD"; off.inputs[1].default_value = (1, 1, 1)
    sh = N.new("ShaderNodeVectorMath"); sh.operation = "SCALE"; sh.inputs["Scale"].default_value = 9; L(rnd.outputs["Color"], sh.inputs[0])
    L(rot.outputs[0], off.inputs[0]); L(sh.outputs[0], off.inputs[2])
    # Fond ivoire légèrement nuageux (profondeur de la pierre), puis veines fines et diagonales, à peine marquées.
    n = N.new("ShaderNodeTexNoise"); n.inputs["Scale"].default_value = 2.5; n.inputs["Detail"].default_value = 4
    L(off.outputs[0], n.inputs["Vector"])
    cloud = ramp(nt, [(0.3, (0.89, 0.86, 0.805)), (0.7, (0.93, 0.905, 0.855))]); L(n.outputs["Fac"], cloud.inputs[0])
    w = N.new("ShaderNodeTexWave"); w.wave_profile = "SIN"
    w.inputs["Scale"].default_value = 0.55; w.inputs["Distortion"].default_value = 9; w.inputs["Detail"].default_value = 6
    w.inputs["Detail Scale"].default_value = 1.6; w.inputs["Detail Roughness"].default_value = 0.6
    L(off.outputs[0], w.inputs["Vector"])
    vein = N.new("ShaderNodeMapRange"); vein.inputs["From Min"].default_value = 0; vein.inputs["From Max"].default_value = 0.03
    vein.inputs["To Min"].default_value = 0.28; vein.inputs["To Max"].default_value = 0; L(w.outputs["Fac"], vein.inputs["Value"])
    r = N.new("ShaderNodeMix"); r.data_type = "RGBA"; r.inputs["B"].default_value = (0.70, 0.64, 0.56, 1)
    L(vein.outputs[0], r.inputs["Factor"]); L(cloud.outputs[0], r.inputs["A"])
    r.outputs[0].name  # sortie « Result »
    # Légère différence de ton d'une dalle à l'autre (±1,5 %), comme une vraie pose.
    tone = N.new("ShaderNodeMapRange"); tone.inputs["To Min"].default_value = 0.985; tone.inputs["To Max"].default_value = 1.015; L(rs.outputs[1], tone.inputs["Value"])
    tint = N.new("ShaderNodeVectorMath"); tint.operation = "SCALE"; L(r.outputs["Result"], tint.inputs[0]); L(tone.outputs[0], tint.inputs["Scale"])
    # Joints fins : distance au bord de la dalle (≈ 9 mm à l'échelle réelle).
    sx = N.new("ShaderNodeSeparateXYZ"); L(frac.outputs[0], sx.inputs[0])
    def edge(sock):
        a = N.new("ShaderNodeMath"); a.operation = "SUBTRACT"; a.inputs[0].default_value = 1; L(sock, a.inputs[1])
        m = N.new("ShaderNodeMath"); m.operation = "MINIMUM"; L(sock, m.inputs[0]); L(a.outputs[0], m.inputs[1]); return m.outputs[0]
    d = N.new("ShaderNodeMath"); d.operation = "MINIMUM"; L(edge(sx.outputs[0]), d.inputs[0]); L(edge(sx.outputs[1]), d.inputs[1])
    j = N.new("ShaderNodeMath"); j.operation = "LESS_THAN"; j.inputs[1].default_value = 0.0038; L(d.outputs[0], j.inputs[0])
    mix = N.new("ShaderNodeMix"); mix.data_type = "RGBA"; mix.inputs["B"].default_value = (0.70, 0.66, 0.60, 1)
    L(j.outputs[0], mix.inputs["Factor"]); L(tint.outputs[0], mix.inputs["A"]); L(mix.outputs["Result"], sink)

for name, fn in [(a, b) for a, b in [("marbre", marble), ("dalles", dalles), ("pierre", stone), ("champagne", brushed)] if a in sys.argv[sys.argv.index("--") + 2:] or len(sys.argv) == sys.argv.index("--") + 2]:
    material(name, fn); sc.render.filepath = f"{out}/{name}.png"; bpy.ops.render.render(write_still=True)

# Textures du mall réaliste fabriquées dans Blender (procédural, rendu « albédo » via émission, sans lumière).
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

for name, fn in [(a, b) for a, b in [("marbre", marble), ("pierre", stone), ("champagne", brushed)] if a in sys.argv[sys.argv.index("--") + 2:] or len(sys.argv) == sys.argv.index("--") + 2]:
    material(name, fn); sc.render.filepath = f"{out}/{name}.png"; bpy.ops.render.render(write_still=True)

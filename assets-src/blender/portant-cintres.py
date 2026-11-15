# Portant et cintres des boutiques (lot Blender de Rhamone ; finitions validées le 9 nov. : « Good »,
# assets-src/references/mall-realiste/portant-cintres-finitions.png). Formes seules : le moteur (côté Serge) pose les
# matières du site par leur nom et place chaque pièce. Lancer :
#   blender -b -P assets-src/blender/portant-cintres.py -- public/models/portant.glb [apercu.png]
#   (ou python avec le module bpy) ; le 2e chemin, facultatif, rend un aperçu Cycles de la scène de contrôle.
#
# Contrat de livraison (mètres, glTF Y vertical ; repère three.js : x le long de la tringle, y vers le haut, z vers l'allée)
#   Tube           tringle Ø 32 mm, LONGUEUR 1 m le long de x, origine au centre : étirer en x à la longueur voulue.
#                  Matière « Champagne » (tube brossé ; mettre la texture champagne du site, répétition en x).
#   Fixation       platine murale Ø 90 mm + bras de 0,38 m. Origine sur l'axe du tube ; le bras part vers −z (le mur).
#                  Matière « Champagne ». Deux par tringle, aux extrémités. (0,38 m = écart actuel tube/mur du moteur.)
#   Cintre         cintre noir mat à épaules (largeur 0,42 m) + crochet court. ORIGINE = AXE DU TUBE quand il est pendu :
#                  placer le cintre à la position du tube, rien à deviner. Matières « Cintre_Noir » et « Laiton ».
#   Cintre_Pinces  barre à pinces pour pantalons et shorts (0,36 m, deux pinces). Même origine. Matières « Cintre_Noir »,
#                  « Laiton », « Pince ».
#   Repères (objets vides, exportés comme nœuds) :
#     Repere_Epaules  ligne des épaules du cintre (haut du vêtement pendu, y = −0,095 sous l'axe du tube)
#     Repere_Taille   haut de la taille sous les pinces (y = −0,135)
# Le cintre est caché dans le vêtement : seul le crochet dépasse au-dessus du col (règle du projet). Ne pas dessiner
# de cintre en plus quand la photo du vêtement en montre déjà un (décision du 9 nov.) : c'est au moteur de choisir.
import bpy, math, sys

argv = sys.argv[sys.argv.index("--") + 1:]
out = argv[0]
preview = argv[1] if len(argv) > 1 else None
bpy.ops.wm.read_factory_settings(use_empty=True)
TUBE_R, WIRE_R = 0.016, 0.0032


def B(x, y, z):
    """three.js (x, y vertical, z vers l'allée) → Blender (x, −z, y)."""
    return (x, -z, y)


def mat(name, rgb, metal=0.0, rough=0.5):
    m = bpy.data.materials.get(name)
    if m:
        return m
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (*rgb, 1)
    p.inputs["Metallic"].default_value = metal
    p.inputs["Roughness"].default_value = rough
    return m


CHAMP = mat("Champagne", (0.72, 0.6, 0.42), 0.9, 0.32)
LAITON = mat("Laiton", (0.78, 0.62, 0.36), 1.0, 0.25)
NOIR = mat("Cintre_Noir", (0.02, 0.02, 0.022), 0.0, 0.8)
PINCE = mat("Pince", (0.05, 0.05, 0.055), 0.6, 0.35)


def link(o, material, smooth=True):
    o.data.materials.append(material)
    if smooth and hasattr(o.data, "polygons"):
        for p in o.data.polygons:
            p.use_smooth = True
    return o


def wire(name, pts, radius, material, flatten=1.0):
    """Fil rond (ou aplati en z three.js) qui suit les points (coordonnées three.js), converti en maillage."""
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth, cu.bevel_resolution, cu.use_fill_caps = radius, 3, True
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for i, p in enumerate(pts):
        sp.points[i].co = (*B(*p), 1)
    o = bpy.data.objects.new(name, cu)
    bpy.context.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.convert(target="MESH")
    o = bpy.context.object
    if flatten != 1.0:
        o.scale = (1, flatten, 1)  # Blender y = −z three : aplatit dans l'épaisseur du cintre
        bpy.ops.object.transform_apply(scale=True)
    o.select_set(False)
    return link(o, material)


def arc(cx, cy, r, a0, a1, n=14, z=0.0):
    return [(cx + r * math.cos(a0 + (a1 - a0) * i / n), cy + r * math.sin(a0 + (a1 - a0) * i / n), z) for i in range(n + 1)]


def join(name, objs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    objs[0].name = name
    objs[0].select_set(False)
    return objs[0]


def hook(name):
    """Crochet court : monte du col, passe par-dessus le tube (axe = origine) et redescend un peu derrière.
    Il tourne autour de l'axe x du tube, donc dans le plan (z, y) three.js."""
    R = TUBE_R + WIRE_R
    pts = [(0, -0.078, 0), (0, -0.045, 0), (0, -0.03, 0.008)]
    pts += [(0, R * math.sin(a), R * math.cos(a)) for a in [math.radians(t) for t in range(-60, 241, 15)]]
    pts += [(0, -0.012, -0.016)]
    return wire(name, pts, WIRE_R, LAITON)


def empty(name, y):
    e = bpy.data.objects.new(name, None)
    e.location = B(0, y, 0)
    e.empty_display_size = 0.03
    bpy.context.collection.objects.link(e)
    return e


# Tringle : tube de 1 m le long de x, extrémités arrondies.
bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=TUBE_R, depth=1.0, location=(0, 0, 0), rotation=(0, math.pi / 2, 0))
tube = link(bpy.context.object, CHAMP)
tube.name = "Tube"
bv = tube.modifiers.new("biseau", "BEVEL")
bv.width, bv.segments = 0.004, 3
bpy.context.view_layer.objects.active = tube
bpy.ops.object.modifier_apply(modifier=bv.name)
bpy.ops.object.transform_apply(rotation=True)

# Fixation : bras horizontal vers le mur (−z three) + platine ronde biseautée au mur.
bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=0.011, depth=0.38, location=B(0, 0, -0.19), rotation=(math.pi / 2, 0, 0))
bras = link(bpy.context.object, CHAMP)
bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=0.045, depth=0.012, location=B(0, 0, -0.374), rotation=(math.pi / 2, 0, 0))
plat = link(bpy.context.object, CHAMP)
bv = plat.modifiers.new("biseau", "BEVEL")
bv.width, bv.segments = 0.004, 3
bpy.context.view_layer.objects.active = plat
bpy.ops.object.modifier_apply(modifier=bv.name)
bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=0.0145, location=(0, 0, 0))
noeud = link(bpy.context.object, CHAMP)  # bague autour du tube
fixation = join("Fixation", [bras, plat, noeud])
fixation.select_set(True)
bpy.context.view_layer.objects.active = fixation
bpy.ops.object.transform_apply(rotation=True)
fixation.select_set(False)

# Cintre à épaules : col sous le crochet, épaules arrondies qui descendent vers les manches, noir mat, aplati.
Y0 = -0.078
shoulders = [(-0.21, Y0 - 0.058, 0), (-0.17, Y0 - 0.046, 0), (-0.11, Y0 - 0.03, 0), (-0.05, Y0 - 0.012, 0), (0, Y0 - 0.004, 0),
             (0.05, Y0 - 0.012, 0), (0.11, Y0 - 0.03, 0), (0.17, Y0 - 0.046, 0), (0.21, Y0 - 0.058, 0)]
corps = wire("corps", shoulders, 0.011, NOIR, flatten=0.55)
col = wire("col", [(0, Y0 + 0.004, 0), (0, Y0 - 0.006, 0)], 0.008, NOIR)
cintre = join("Cintre", [hook("crochet"), corps, col])

# Cintre à pinces : barre noire, deux pinces sous la barre (au-dessus de la taille du vêtement).
barre = wire("barre", [(-0.18, Y0 - 0.02, 0), (0.18, Y0 - 0.02, 0)], 0.007, NOIR, flatten=0.7)
tige = wire("tige", [(0, Y0, 0), (0, Y0 - 0.02, 0)], 0.004, LAITON)
pinces = []
for sx in (-0.155, 0.155):
    bpy.ops.mesh.primitive_cube_add(size=1, location=B(sx, Y0 - 0.044, 0))
    p = bpy.context.object
    p.scale = (0.03, 0.016, 0.042)  # Blender : x, épaisseur (−z three), hauteur (y three)
    bpy.ops.object.transform_apply(scale=True)
    bv = p.modifiers.new("biseau", "BEVEL")
    bv.width, bv.segments = 0.003, 2
    bpy.context.view_layer.objects.active = p
    bpy.ops.object.modifier_apply(modifier=bv.name)
    pinces.append(link(p, PINCE))
pinces_obj = join("Cintre_Pinces", [hook("crochet2"), tige, barre] + pinces)

empty("Repere_Epaules", -0.095)
empty("Repere_Taille", -0.135)

# Export : seulement les pièces du contrat (pas la scène de contrôle).
bpy.ops.object.select_all(action="DESELECT")
for n in ("Tube", "Fixation", "Cintre", "Cintre_Pinces", "Repere_Epaules", "Repere_Taille"):
    bpy.data.objects[n].select_set(True)
bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True, export_yup=True, export_materials="EXPORT",
                          export_normals=True, use_selection=True)
for o in bpy.data.objects:
    if o.type == "MESH":
        print("OBJET", o.name, len(o.data.polygons), "faces", [round(v, 3) for v in o.dimensions])

if preview:
    # Scène de contrôle (non exportée) : tringle de 1,2 m sur un mur clair, trois cintres et un cintre à pinces.
    sc = bpy.context.scene
    sc.render.engine, sc.cycles.samples, sc.cycles.device = "CYCLES", 48, "CPU"
    sc.render.resolution_x, sc.render.resolution_y = 1200, 900
    sc.view_settings.view_transform = "Filmic" if "Filmic" in [i.identifier for i in sc.view_settings.bl_rna.properties["view_transform"].enum_items] else "Standard"
    tube.scale.x = 1.2
    for x in (-0.6, 0.6):
        f = fixation.copy(); f.data = fixation.data; f.location = B(x, 0, 0); sc.collection.objects.link(f)
    fixation.hide_render = True
    for i, x in enumerate((-0.48, 0.0, 0.48)):
        c = (pinces_obj if i == 2 else cintre).copy(); c.location = B(x, 0, 0); sc.collection.objects.link(c)
    cintre.hide_render = pinces_obj.hide_render = True
    bpy.ops.mesh.primitive_plane_add(size=4, location=B(0, -1, -0.38), rotation=(math.pi / 2, 0, 0))
    link(bpy.context.object, mat("Mur", (0.86, 0.82, 0.76), 0, 0.9), smooth=False)
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam")); sc.collection.objects.link(cam); sc.camera = cam
    cam.location = B(0.0, -0.1, 2.1); cam.rotation_euler = (math.radians(90), 0, 0); cam.data.lens = 50
    for loc, e in ((B(-0.8, 1.0, 1.4), 45), (B(1.0, 0.4, 1.2), 18)):
        l = bpy.data.objects.new("lum", bpy.data.lights.new("lum", "AREA")); l.data.energy = e; l.data.size = 1.2
        l.location = loc; sc.collection.objects.link(l)
        tr = l.constraints.new("TRACK_TO"); tr.target = tube
    sc.world = bpy.data.worlds.new("w"); sc.world.color = (0.12, 0.115, 0.11)
    sc.render.filepath = preview
    bpy.ops.render.render(write_still=True)

# Duo de mannequins de vitrine (lot Blender de Rhamone ; référence validée « oui je valide » :
# assets-src/references/mall-realiste/mannequins-duo-valide.png, branche feat/gpt/plan-mall-realiste).
# Homme : appui détendu, bras relâchés. Femme : main droite sur la hanche, léger déhanché, genou gauche relâché.
#
# Méthode reproductible : on part des mannequins du site (public/models/mannequin.glb et mannequin-femme.glb, déjà
# allégés et féminisés par scripts/prep-mannequin.mjs : pas de seconde déformation), on pose un squelette simple sur le
# corps (poids automatiques), les vêtements suivent le corps (poids recopiés du corps), les baskets suivent les tibias.
# On pose, on applique, on exporte un modèle statique : mêmes noms d'objets et de matières que le moteur attend.
#   python assets-src/blender/mannequins-duo.py -- femme <mannequin-femme.glb non posé> sortie.glb
#   python assets-src/blender/mannequins-duo.py -- homme <mannequin.glb non posé> sortie.glb
# Source = sortie de scripts/prep-mannequin.mjs (sans pose) : ne jamais reposer un modèle déjà posé. La sortie passe
# ensuite par weld/dedup/prune/quantize (gltf-transform) avant public/models/.
# Reste connu (13 nov.) : petite déchirure de la manche droite de la femme vue de profil ; bas du pantalon gauche de
# l'homme un peu froissé ; ceinture froncée d'origine (modèle source).
import bpy, sys, math
from mathutils import Vector

a = sys.argv[sys.argv.index("--") + 1:]
KIND, SRC, OUT = a[0], a[1], a[2]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
for o in list(bpy.data.objects):  # appliquer les transformations de l'import (repère Blender, Z vertical)
    if o.type == "MESH":
        if o.data.users > 1:  # baskets gauche/droite partageant un même maillage : chacune sa copie
            o.data = o.data.copy()
        o.select_set(True)
bpy.context.view_layer.objects.active = bpy.data.objects["Mannequin_Corps"]
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.ops.object.select_all(action="DESELECT")

body = bpy.data.objects["Mannequin_Corps"]
M = body.matrix_world
V = [M @ v.co for v in body.data.vertices]


def centre(xmin, xmax, z, dz=0.012):
    """Centre de la section du corps entre xmin et xmax à la hauteur z (axe d'un membre)."""
    s = [v for v in V if xmin <= v.x <= xmax and abs(v.z - z) < dz]
    if not s:
        return Vector(((xmin + xmax) / 2, 0, z))
    return Vector((sum(v.x for v in s) / len(s), sum(v.y for v in s) / len(s), z))


# --- Squelette (mesures du corps : épaules ≈ 1,42 m, coudes ≈ 1,12, poignets ≈ 0,87, hanches ≈ 0,93, genoux ≈ 0,50)
bpy.ops.object.armature_add(location=(0, 0, 0))
arm = bpy.context.object
arm.name = "Squelette"
bpy.ops.object.mode_set(mode="EDIT")
eb = arm.data.edit_bones
eb.remove(eb[0])


def bone(name, head, tail, parent=None):
    b = eb.new(name)
    b.head, b.tail = Vector(head), Vector(tail)
    if parent:
        b.parent = eb[parent]
        b.use_connect = (b.parent.tail - b.head).length < 1e-4
    return b


yc = centre(-0.1, 0.1, 1.2).y
bone("Bassin", (0, yc, 0.86), (0, yc, 1.05))
bone("Dos", (0, yc, 1.05), (0, yc, 1.40), "Bassin")
bone("Tete", (0, yc, 1.40), (0, yc, 1.83), "Dos")
for s, side in ((1, "G"), (-1, "D")):  # G = gauche du personnage (x > 0 : il regarde vers −y), D = droite
    sh = centre(0.16 * s if s > 0 else -0.30, 0.30 if s > 0 else -0.16, 1.40)
    el = centre(0.20 if s > 0 else -0.31, 0.31 if s > 0 else -0.20, 1.12)
    wr = centre(0.24 if s > 0 else -0.32, 0.32 if s > 0 else -0.24, 0.87)
    sh.x = 0.19 * s
    bone(f"Epaule_{side}", (0.06 * s, yc, 1.40), sh, "Dos")
    bone(f"Bras_{side}", sh, el, f"Epaule_{side}")
    bone(f"AvantBras_{side}", el, wr, f"Bras_{side}")
    bone(f"Main_{side}", wr, (wr.x, wr.y, 0.74), f"AvantBras_{side}")
    hip = centre(0.03 if s > 0 else -0.19, 0.19 if s > 0 else -0.03, 0.80)
    kn = centre(0.03 if s > 0 else -0.19, 0.19 if s > 0 else -0.03, 0.50)
    an = centre(0.05 if s > 0 else -0.20, 0.20 if s > 0 else -0.05, 0.12)
    hip.z = 0.90
    bone(f"Cuisse_{side}", hip, kn, "Bassin")
    bone(f"Tibia_{side}", kn, an, f"Cuisse_{side}")
bpy.ops.object.mode_set(mode="OBJECT")

# --- Poids : automatiques sur le corps ; vêtements recopiés du corps ; baskets rattachées aux tibias.
bpy.ops.object.select_all(action="DESELECT")
body.select_set(True)
arm.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type="ARMATURE_AUTO")
for o in bpy.data.objects:
    if o.type != "MESH" or o is body:
        continue
    n = o.name
    if n.startswith("Basket") or n.startswith("Socle"):
        if n.startswith("Basket"):
            side = "G" if sum((o.matrix_world @ v.co).x for v in o.data.vertices[:50]) > 0 else "D"
            vg = o.vertex_groups.new(name=f"Tibia_{side}")
            vg.add([v.index for v in o.data.vertices], 1.0, "REPLACE")
            mod = o.modifiers.new("squelette", "ARMATURE")
            mod.object = arm
        continue
    for g in body.vertex_groups:
        o.vertex_groups.new(name=g.name)
    dt = o.modifiers.new("poids", "DATA_TRANSFER")
    dt.object = body
    dt.use_vert_data = True
    dt.data_types_verts = {"VGROUP_WEIGHTS"}
    dt.vert_mapping = "POLYINTERP_NEAREST"
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.datalayout_transfer(modifier=dt.name)
    bpy.ops.object.modifier_apply(modifier=dt.name)
    # Manches : elles suivent le bras entier (sinon le haut de la manche reste collé au buste et le bras la perce).
    if n.startswith("Tee"):
        for side, sg in (("G", 1), ("D", -1)):
            g_arm = o.vertex_groups.get(f"Bras_{side}")
            for v in o.data.vertices:
                p_ = o.matrix_world @ v.co
                w = min(1.0, max(0.0, (p_.x * sg - 0.17) / 0.05)) if 1.15 < p_.z < 1.5 else 0.0
                if w <= 0:
                    continue
                for ge in v.groups:  # les autres os perdent la part w, le bras la prend
                    if o.vertex_groups[ge.group].name != f"Bras_{side}":
                        ge.weight *= 1 - w
                g_arm.add([v.index], w, "ADD")
    mod = o.modifiers.new("squelette", "ARMATURE")
    mod.object = arm

# --- Poses (degrés ; axes locaux des os). Sol : les pieds restent posés.
P = arm.pose.bones


def rot(name, x=0, y=0, z=0):
    pb = P[name]
    pb.rotation_mode = "XYZ"
    pb.rotation_euler = (math.radians(x), math.radians(y), math.radians(z))


if KIND == "femme":
    # Main droite sur la hanche : la main va sur le flanc (cible), le coude part sur le côté et un peu en arrière
    # (pôle) ; Blender calcule les angles du bras (IK), plus sûr que des angles tapés à la main.
    waist = max(abs(v.x) for v in V if abs(v.z - 1.0) < 0.01 and v.x < 0 and v.x > -0.2)
    tgt = bpy.data.objects.new("cible", None); tgt.location = (-(waist + 0.015), yc + 0.01, 1.0); bpy.context.scene.collection.objects.link(tgt)
    pole = bpy.data.objects.new("pole", None); pole.location = (-0.75, yc + 0.25, 1.2); bpy.context.scene.collection.objects.link(pole)
    ik = P["AvantBras_D"].constraints.new("IK")
    ik.target, ik.pole_target, ik.chain_count, ik.pole_angle = tgt, pole, 2, math.radians(float(__import__("os").environ.get("POLE", "0")))
    rot("Main_D", x=-10, z=-25)
    # Léger déhanché : bassin incliné, genou gauche relâché, buste qui compense.
    rot("Bassin", y=4)
    rot("Dos", y=-6)
    rot("Cuisse_G", x=-6, y=-2)
    rot("Tibia_G", x=10)
    rot("Bras_G", z=6)
else:
    # Appui détendu : poids sur la jambe droite, genou gauche juste relâché, bras relâchés un peu écartés.
    rot("Bassin", y=2, z=4)
    rot("Dos", y=-2, z=-5)
    rot("Cuisse_G", x=-2)
    rot("Tibia_G", x=4)
    rot("Bras_G", z=5)
    rot("Bras_D", z=-5)
    rot("AvantBras_G", x=-8)
    rot("AvantBras_D", x=-10)
bpy.context.view_layer.update()

# Les pieds posés au sol : on remonte/descend tout le personnage pour que la semelle la plus basse touche z = 0.
for o in bpy.data.objects:
    if o.type == "MESH" and not o.name.startswith("Socle"):
        bpy.context.view_layer.objects.active = o
        for m in list(o.modifiers):
            if m.type == "ARMATURE":
                bpy.ops.object.modifier_apply(modifier=m.name)
        o.parent = None
        o.vertex_groups.clear()
bpy.data.objects.remove(arm)
soles = [o for o in bpy.data.objects if o.name.startswith("Basket_Semelle")]
low = min((o.matrix_world @ v.co).z for o in soles for v in o.data.vertices) if soles else None
plate = bpy.data.objects.get("Socle_Plaque")
top = max((plate.matrix_world @ v.co).z for v in plate.data.vertices) if plate else 0.0
if low is not None:
    dz = top - low
    for o in bpy.data.objects:
        if o.type == "MESH" and not o.name.startswith("Socle"):
            o.location.z += dz

bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_apply=True, export_yup=True, export_materials="EXPORT", export_normals=True)
xs = [(o.matrix_world @ v.co).x for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith("Socle") for v in o.data.vertices]
print("LARGEUR", round(max(xs) - min(xs), 3), "m", "TRIANGLES", sum(sum(len(p.vertices) - 2 for p in o.data.polygons) for o in bpy.data.objects if o.type == "MESH"))

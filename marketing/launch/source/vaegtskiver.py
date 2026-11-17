"""Original studio photograph in Cycles. Run with Blender in background mode.
blender -b -t 5 -P marketing/launch/source/vaegtskiver.py -- --width 1800 --out /tmp/skiver.png
"""
import argparse
import math
from pathlib import Path
import sys

import bpy
from mathutils import Matrix, Vector
from bpy_extras.object_utils import world_to_camera_view

args = argparse.ArgumentParser()
args.add_argument('--width', type=int, default=1800)
args.add_argument('--samples', type=int, default=40)
args.add_argument('--panorama', action='store_true')
args.add_argument('--share', action='store_true')
args.add_argument('--out', type=Path, required=True)
options = args.parse_args(sys.argv[sys.argv.index('--') + 1:])
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = options.samples
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 6
scene.cycles.diffuse_bounces = 3
scene.cycles.glossy_bounces = 4
scene.render.resolution_x = options.width
scene.render.resolution_y = round(options.width * 5 / 12) if options.panorama else round(options.width * 3 / 4)
if options.share:
    scene.render.resolution_y = round(options.width * 630 / 1200)
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.view_settings.exposure = -.1
scene.render.threads_mode = 'FIXED'
scene.render.threads = 5

def srgb(rgb):
    return tuple((v / 255 / 12.92 if v / 255 <= .04045 else ((v / 255 + .055) / 1.055) ** 2.4) for v in rgb) + (1,)

def surface(name, rgb, metal, roughness, coat=0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = srgb(rgb)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = srgb(rgb)
    shader.inputs['Metallic'].default_value = metal
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Coat Weight'].default_value = coat
    shader.inputs['Coat Roughness'].default_value = .29
    return mat, shader

def microfinish(mat, shader, scale, depth, roughness):
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    coord = nodes.new('ShaderNodeTexCoord')
    noise = nodes.new('ShaderNodeTexNoise')
    noise.inputs['Scale'].default_value = scale
    noise.inputs['Detail'].default_value = 2.2
    noise.inputs['Roughness'].default_value = .63
    links.new(coord.outputs['Object'], noise.inputs['Vector'])
    bump = nodes.new('ShaderNodeBump')
    bump.inputs['Distance'].default_value = depth
    bump.inputs['Strength'].default_value = .34
    links.new(noise.outputs['Fac'], bump.inputs['Height'])
    links.new(bump.outputs['Normal'], shader.inputs['Normal'])
    remap = nodes.new('ShaderNodeMapRange')
    remap.inputs['To Min'].default_value, remap.inputs['To Max'].default_value = roughness
    links.new(noise.outputs['Fac'], remap.inputs['Value'])
    links.new(remap.outputs['Result'], shader.inputs['Roughness'])

enamel, enamel_shader = surface('Kiln blue · fine mineral enamel', (7, 39, 157), .21, .43, .085)
microfinish(enamel, enamel_shader, 100, .0035, (.38, .56))
# A dry, granular casting under one thin coat. The two cool tones form fine aggregate, not decals.
nodes, links = enamel.node_tree.nodes, enamel.node_tree.links
aggregate = nodes.new('ShaderNodeTexNoise')
aggregate.inputs['Scale'].default_value = 128
aggregate.inputs['Detail'].default_value = 2.4
aggregate.inputs['Roughness'].default_value = .66
links.new(nodes.get('Texture Coordinate').outputs['Object'], aggregate.inputs['Vector'])
tint = nodes.new('ShaderNodeValToRGB')
tint.color_ramp.elements[0].position = .24
tint.color_ramp.elements[0].color = srgb((6, 26, 109))
tint.color_ramp.elements[1].position = .78
tint.color_ramp.elements[1].color = srgb((11, 52, 158))
links.new(aggregate.outputs['Fac'], tint.inputs['Fac'])
links.new(tint.outputs['Color'], enamel_shader.inputs['Base Color'])
steel, steel_shader = surface('Turned stainless bore and face', (161, 173, 179), .99, .30)
for socket in steel_shader.inputs:
    if socket.name in ('Anisotropic IOR Level', 'Anisotropic', 'Anisotropic Weight'):
        socket.default_value = .48
nodes, links = steel.node_tree.nodes, steel.node_tree.links
coord = nodes.new('ShaderNodeTexCoord')
wave = nodes.new('ShaderNodeTexWave')
wave.wave_type = 'RINGS'
wave.rings_direction = 'Z'
wave.inputs['Scale'].default_value = 159
wave.inputs['Distortion'].default_value = .12
links.new(coord.outputs['Object'], wave.inputs['Vector'])
ringrough = nodes.new('ShaderNodeMapRange')
ringrough.inputs['To Min'].default_value = .23
ringrough.inputs['To Max'].default_value = .38
links.new(wave.outputs['Color'], ringrough.inputs['Value'])
links.new(ringrough.outputs['Result'], steel_shader.inputs['Roughness'])
ink, _ = surface('Ivory enamel on raised figures', (220, 219, 200), .15, .36)
floor, floor_shader = surface('Warm chalk studio', (230, 224, 208), 0, .83)
microfinish(floor, floor_shader, 400, .0008, (.74, .87))

def turn(name, profile, material):
    count = 256
    vs = []
    for radius, height in profile:
        for i in range(count):
            theta = math.tau * i / count
            vs.append((radius * math.cos(theta), radius * math.sin(theta), height))
    faces = []
    for j in range(len(profile)):
        k = (j + 1) % len(profile)
        for i in range(count):
            m = (i + 1) % count
            faces.append((j * count + i, j * count + m, k * count + m, k * count + i))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vs, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    mesh.materials.append(material)
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    return obj

# One Blender unit is 100 mm. Both copies share the complete blank, bush and cast stamp.
# A small Olympic loading increment: 160 mm outside and a 50.4 mm clearance bore.
# The profile is assembled from back to front around the outside, keeping the grip lip continuous.
cross_section = [
    (.297, -.054), (.299, -.060), (.312,-.063), (.340,-.063), (.354,-.060),
    (.368,-.049), (.381,-.046), (.640,-.046), (.654,-.049), (.666,-.058),
    (.677,-.061), (.703,-.061), (.709,-.058), (.719,-.058), (.725,-.061),
    (.761,-.061), (.774,-.059), (.788,-.052), (.797,-.039), (.800,-.026),
    (.800,.026), (.797,.039), (.788,.052), (.774,.059), (.761,.061),
    (.725,.061), (.719,.058), (.709,.058), (.703,.061), (.677,.061),
    (.666,.058), (.654,.049), (.640,.046), (.381,.046), (.368,.049),
    (.354,.060), (.340,.063), (.312,.063), (.299,.060), (.297,.054)
]
blank = turn('Enamelled iron plate', cross_section, enamel)
bush = turn('Brushed sleeve', [
    (.252,-.050), (.253,-.054), (.261,-.059), (.269,-.061), (.293,-.061),
    (.299,-.058), (.302,-.054), (.302,.054), (.299,.058), (.293,.061),
    (.287,.061), (.285,.0604), (.283,.061), (.277,.061), (.276,.0604), (.274,.061), (.269,.061), (.261,.059), (.253,.054), (.252,.050)
], steel)

font_path = Path(__file__).resolve().parents[3] / 'public/fonts/CabinetGrotesk-800.woff2'
font = bpy.data.fonts.load(str(font_path))

def stamp(name, y, size):
    base = bpy.data.curves.new(name, type='FONT')
    base.body = name
    base.font = font
    base.size = size
    base.align_x = 'CENTER'
    base.align_y = 'CENTER'
    base.extrude = .0032
    base.bevel_depth = .002
    base.bevel_resolution = 3
    relief = bpy.data.objects.new('Raised ' + name, base)
    bpy.context.collection.objects.link(relief)
    relief.location = (0, y, .048)
    base.materials.append(enamel)
    paint_curve = base.copy()
    paint_curve.extrude = 0
    paint_curve.bevel_depth = 0
    paint_curve.materials.clear()
    paint_curve.materials.append(ink)
    paint = bpy.data.objects.new('Filled face ' + name, paint_curve)
    bpy.context.collection.objects.link(paint)
    paint.location = (0, y, .0535)
    return [relief, paint]

parts = [blank, bush] + stamp('1,25', .493, .25) + stamp('KG', -.499, .121)

def mount(name, position, normal, spin, duplicate):
    empty = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(empty)
    n = Vector(normal).normalized()
    u = Vector((1, 0, 0)) if n.z > .999 else Vector((-n.y,n.x,0)).normalized()
    v = n.cross(u).normalized()
    orientation = Matrix((u,v,n)).transposed() @ Matrix.Rotation(math.radians(spin), 3, 'Z')
    empty.matrix_world = Matrix.Translation(position) @ orientation.to_4x4()
    for instance in parts:
        part = instance.copy() if duplicate else instance
        if duplicate:
            bpy.context.collection.objects.link(part)
        part.parent = empty
    return empty

mount('Left · resting plate', (-.40,-.04,.0631), (0,0,1), 40, True)
n = Vector((-.58,-.76,.27)).normalized()
top = max(radius * math.sqrt(1 - n.z * n.z) + abs(z) * n.z for radius, z in cross_section) + .0001
mount('Right · leaning plate', (.657,.42,top), n, 8, False)
bpy.ops.mesh.primitive_plane_add(size=200, location=(0,0,0))
bpy.context.object.data.materials.append(floor)
paper_receiver = bpy.data.collections.new('Backdrop wash receiver')
scene.collection.children.link(paper_receiver)
paper_receiver.objects.link(bpy.context.object)

world = bpy.data.worlds.new('Diffused studio sky')
world.use_nodes = True
world.node_tree.nodes.get('Background').inputs[0].default_value = (.78,.84,1,1)
world.node_tree.nodes.get('Background').inputs[1].default_value = .27
scene.world = world

def softbox(name, position, target, size, height, energy, color):
    lamp = bpy.data.lights.new(name, 'AREA')
    lamp.shape = 'RECTANGLE'
    lamp.size, lamp.size_y, lamp.energy, lamp.color = size, height, energy, color
    obj = bpy.data.objects.new(name, lamp)
    bpy.context.collection.objects.link(obj)
    obj.location = position
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z','Y').to_euler()
    return obj

softbox('Window · left', (-4.05,-.35,3.70), (0,0,.38), 2.15, 1.40, 560, (1,.93,.84))
softbox('White card · front right', (2.5,-3.0,2.55), (0,0,.6), 1.5, 2.8, 125, (.84,.91,1))
softbox('Edge strip · rear', (1.5,2.3,3.65), (0,0,.5), .8, 3.0, 132, (1,.95,.89))
# A broad bounce lights the paper behind the subject independently of the frontal side key.
wash = softbox('Paper sweep · flagged off the plates', (-.6,4.7,4.65), (0,2.85,0), 8.0, 4.4, 665, (1,.96,.90))
wash.light_linking.receiver_collection = paper_receiver
# Off-camera black flags are a photographic way to make the turned metal readable.
flag_mat, _ = surface('Black studio card', (12, 14, 18), 0, .9)
def flag(location, width, height, target):
    bpy.ops.mesh.primitive_plane_add(size=1, location=location)
    obj = bpy.context.object
    obj.name = 'Negative fill'
    obj.scale = (width, height, 1)
    obj.rotation_euler = (Vector(target)-obj.location).to_track_quat('Z','Y').to_euler()
    obj.data.materials.append(flag_mat)
    obj.visible_camera = False
    obj.visible_diffuse = False
    obj.visible_shadow = False

flag((2.2,-1.1,1.05), 1, 2.4, (0,0,.55))
flag((-1.55,.60,1.15), .55, 2.1, (.3,0,.55))
target = Vector((0,.03,.53))
cam_data = bpy.data.cameras.new('Studio 70 mm')
cam = bpy.data.objects.new('Studio camera', cam_data)
bpy.context.collection.objects.link(cam)
cam.location = (1.04,-4.9,2.78)
cam.rotation_euler = (target - cam.location).to_track_quat('-Z','Y').to_euler()
cam_data.lens = 70
scene.camera = cam
# Fit the two manufactured outlines to the plate. The floor and cast shadows do not affect the camera.
bpy.context.view_layer.update()
vertices = [o.matrix_world @ pt.co for o in bpy.context.scene.objects if o.type=='MESH' and o.parent
            for pt in list(o.data.vertices)[::12]]
for iteration in range(3):
    coords = [world_to_camera_view(scene,cam,p) for p in vertices]
    lo, hi = (min(p.x for p in coords),min(p.y for p in coords)), (max(p.x for p in coords),max(p.y for p in coords))
    width_limit = .47 if options.share else .86
    height_limit = .77 if options.share else .82
    target_x = .735 if options.share else .5
    cam_data.lens *= min(width_limit/(hi[0]-lo[0]), height_limit/(hi[1]-lo[1]))
    cam_data.shift_x += (lo[0]+hi[0])/2-target_x
    cam_data.shift_y += ((lo[1]+hi[1])/2-.50)*scene.render.resolution_y/scene.render.resolution_x
    bpy.context.view_layer.update()
scene.render.filepath = str(options.out.resolve())
bpy.ops.render.render(write_still=True)

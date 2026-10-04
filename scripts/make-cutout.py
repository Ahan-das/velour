from PIL import Image, ImageFilter
import numpy as np
im = Image.open('artifact-files/ec2f7d46-49e1-411b-bf05-0baeac96e378/img/field.webp').convert('RGB')
im = im.crop((12, 18, 1167, 1564))  # drop the white print border
a = np.asarray(im).astype(np.float32)/255
H,W,_ = a.shape
r,g,b = a[...,0],a[...,1],a[...,2]
lum = 0.2126*r+0.7152*g+0.0722*b
def ss(e0,e1,x):
    t=np.clip((x-e0)/(e1-e0),0,1); return t*t*(3-2*t)
Y = np.arange(H)[:,None]*np.ones((1,W))
blue = ss(0.035, 0.07, b-r)
cloud = (Y < 800) * ss(0.3, 0.42, lum) * ss(0.14, 0.08, r-b)
horizon = (np.abs(Y - 978) < 16) * ss(0.13, 0.2, lum) * ss(0.5, 0.42, lum)
grass = (Y > 955) * ss(0.035, 0.065, g-b) * ss(0.45, 0.32, lum)
alpha = 1 - np.maximum(np.maximum(blue, horizon), np.maximum(cloud, grass))
# soften zone seams
A = Image.fromarray((alpha*255).astype(np.uint8))
A = A.filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.MinFilter(7)).filter(ImageFilter.MaxFilter(7)).filter(ImageFilter.GaussianBlur(0.8))
# keep only the subject's connected mass: kill specks far from centre columns
al = np.asarray(A).astype(np.float32)/255
xs = np.arange(W)[None,:]*np.ones((H,1))
al[(xs < 90) | (xs > 1000)] = 0
al[Y < 470] = 0
al[(xs < 150) & (Y > 1250)] = 0
from scipy import ndimage
solid = al > 0.5
lab, n = ndimage.label(solid)
sizes = ndimage.sum(solid, lab, range(1, n+1))
keep = lab == (np.argmax(sizes) + 1)
keep = ndimage.binary_closing(keep, iterations=10)
keep = ndimage.binary_fill_holes(keep)
keep = ndimage.binary_dilation(keep, iterations=6)  # leave room for soft hair edges
al = al * keep
# fill interior holes fully opaque, keep the keyed soft edge outside them
core = ndimage.binary_erosion(ndimage.binary_fill_holes(solid & keep), iterations=2)
al = np.maximum(al, core.astype(np.float32))
al = np.asarray(Image.fromarray((al*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))).astype(np.float32)/255
rgb = a.copy()
edge = (Y < 900)[..., None] * (1 - al[..., None])
rgb = rgb * (1 - 0.85 * edge) + np.array([0.06, 0.07, 0.06]) * 0.85 * edge  # despill: fringe goes to hair-dark, not cloud-grey
out = np.dstack([(np.clip(rgb,0,1)*255).astype(np.uint8), (al*255).astype(np.uint8)])
Image.fromarray(out,'RGBA').save('site/public/hero/field-cutout.webp', quality=90, method=6)
im.save('site/public/hero/field.webp', quality=86, method=6)
# preview on red
bg = np.zeros_like(a); bg[...]=[0.8,0.2,0.2]
prev = rgb*al[...,None] + bg*(1-al[...,None])
Image.fromarray((prev*255).astype(np.uint8)).resize((W//2,H//2)).save('cut_preview.jpg')
print(W,H)

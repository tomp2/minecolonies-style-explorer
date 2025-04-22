from pathlib import Path

# Find all .jpg images in repo/public/minecolonies and remove any number from the start of the filename
REPO = Path(__file__).parent.parent
IMAGES = REPO / 'public' / 'minecolonies'

renames = 0
for image in IMAGES.glob('**/*.jpg'):
    new_name = image.with_name(image.name.lstrip('0123456789'))
    if new_name == image:
        continue
    if new_name.exists():
        print(f'File {new_name} already exists, replacing...')
        new_name.unlink()

    renames += 1
    print(f'Renaming {image} to {new_name}')
    image.rename(new_name)

print(f'Renamed {renames} files.')

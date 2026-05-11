# Output Archive

This folder contains the historical output archive that was originally stored under `apps/api/output`.

It is kept here as a repository asset archive, not as the default runtime output directory.

## What is inside

- root TSV files: historical simulation runs and exported datasets
- `img/`: previously generated charts
- `img_paper/`: charts selected or prepared for paper-oriented use
- `simili/` and other subfolders: auxiliary legacy material preserved as-is

## How to use it

If you need an existing dataset as input for analysis or plotting, pick the required `.tsv` file directly from this archive.

If you need to regenerate the DAO comparison plots, use:

```bash
./apps/api/dao-archive-plot.sh
```

The script:

- reads archived DAO TSV files from this folder
- does not modify the archived historical files
- writes regenerated images to `generated-img/`

## Notes

- New runtime outputs should stay local unless they are intentionally curated.
- Only stable or publication-relevant outputs should remain versioned.

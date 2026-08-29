import { describe, it, expect } from 'vitest';
import {
  columnsForWidth,
  CURATED_ICON_NAMES,
  ICON_GRID,
  iconGridWindow,
  iconPool,
  iconTilePosition,
  isIconNameShaped,
  labelFor,
} from '@/lib/iconPicker';
import { TABLER_ICON_NAMES } from '@/lib/tablerIcons';

describe('labelFor', () => {
  it('drops the Icon prefix and splits the camel case', () => {
    expect(labelFor('IconDeviceLaptop')).toBe('Device Laptop');
    expect(labelFor('IconToolsKitchen2')).toBe('Tools Kitchen2');
    expect(labelFor('IconX')).toBe('X');
  });

  it('returns the same string on a second call', () => {
    expect(labelFor('IconBike')).toBe(labelFor('IconBike'));
    expect(labelFor('IconBike')).toBe('Bike');
  });
});

describe('isIconNameShaped', () => {
  it('accepts the export names Tabler actually uses', () => {
    for (const name of ['IconBike', 'IconX', 'Icon123', 'Icon2fa', 'IconToolsKitchen2']) {
      expect(isIconNameShaped(name)).toBe(true);
    }
  });

  it('rejects anything that is not one', () => {
    for (const name of ['', 'Icon', 'bike', 'iconBike', 'Icon-Bike', 'Icon Bike', '../../etc/passwd']) {
      expect(isIconNameShaped(name)).toBe(false);
    }
  });
});

describe('iconPool', () => {
  const ALL = ['IconAbc', 'IconBike', 'IconBikeOff', 'IconDeviceLaptop', 'IconTool'];

  it('leads with the curated set when nothing is typed', () => {
    const pool = iconPool(TABLER_ICON_NAMES, '');

    expect(pool.slice(0, CURATED_ICON_NAMES.length)).toEqual([...CURATED_ICON_NAMES]);
    expect(pool).toHaveLength(TABLER_ICON_NAMES.length);
    expect(new Set(pool).size).toBe(pool.length);
  });

  it('keeps the export order behind the curated set', () => {
    const pool = iconPool(ALL, '');

    expect(pool).toEqual(['IconDeviceLaptop', 'IconTool', 'IconBike', 'IconAbc', 'IconBikeOff']);
  });

  it('filters on the readable label, not the export name', () => {
    expect(iconPool(ALL, 'device laptop')).toEqual(['IconDeviceLaptop']);
    expect(iconPool(ALL, 'Icon')).toEqual([]);
  });

  it('ranks a whole-word hit above a mere substring', () => {
    expect(iconPool(['IconCardboards', 'IconCarousel', 'IconCar'], 'car')).toEqual([
      'IconCar',
      'IconCardboards',
      'IconCarousel',
    ]);
  });

  it('finds icons through their Polish alias', () => {
    expect(iconPool(TABLER_ICON_NAMES, 'rower')[0]).toBe('IconBike');
    expect(iconPool(TABLER_ICON_NAMES, 'lampa')[0]).toBe('IconLamp');
    expect(iconPool(TABLER_ICON_NAMES, 'dom')[0]).toBe('IconHome');
    expect(iconPool(TABLER_ICON_NAMES, 'ksiazka')).toContain('IconBook');
    expect(iconPool(TABLER_ICON_NAMES, 'książka')).toContain('IconBook');
  });

  it('still searches the English names the library ships with', () => {
    expect(iconPool(TABLER_ICON_NAMES, 'bike')[0]).toBe('IconBike');
    expect(iconPool(TABLER_ICON_NAMES, 'armchair')).toContain('IconArmchair');
  });

  it('returns nothing for a query that matches no label', () => {
    expect(iconPool(TABLER_ICON_NAMES, 'qqzzxx')).toEqual([]);
  });
});

describe('iconGridWindow', () => {
  const { ROW_H, VIEW_H, COLS, OVERSCAN } = ICON_GRID;

  it('never shrinks the canvas below one viewport', () => {
    expect(iconGridWindow(0, 0).contentHeight).toBe(VIEW_H);
    expect(iconGridWindow(8, 0).contentHeight).toBe(VIEW_H);
  });

  it('sizes the canvas to the row count', () => {
    expect(iconGridWindow(6250, 0).contentHeight).toBe(Math.ceil(6250 / COLS) * ROW_H);
  });

  it('renders the first screen plus the overscan at rest', () => {
    const { startIndex, endIndex } = iconGridWindow(6250, 0);

    expect(startIndex).toBe(0);
    expect(endIndex).toBe((Math.ceil(VIEW_H / ROW_H) + OVERSCAN) * COLS);
  });

  it('moves the window down as the list scrolls', () => {
    const { startIndex, endIndex } = iconGridWindow(6250, 100 * ROW_H);

    expect(startIndex).toBe((100 - OVERSCAN) * COLS);
    expect(endIndex).toBe((100 + Math.ceil(VIEW_H / ROW_H) + OVERSCAN) * COLS);
  });

  it('renders a slice, not the library', () => {
    const { startIndex, endIndex } = iconGridWindow(6250, 0);

    expect(endIndex - startIndex).toBeLessThan(200);
  });

  it('stops at the last icon', () => {
    const { endIndex } = iconGridWindow(20, 0);

    expect(endIndex).toBe(20);
  });
});

describe('iconTilePosition', () => {
  it('lays the index out across then down', () => {
    expect(iconTilePosition(0)).toEqual({ top: 0, left: 0 });
    expect(iconTilePosition(7)).toEqual({ top: 0, left: 7 * ICON_GRID.COL_W });
    expect(iconTilePosition(8)).toEqual({ top: ICON_GRID.ROW_H, left: 0 });
  });
});

describe('columnsForWidth', () => {
  it('draws the handoff grid when the handoff width is there', () => {
    expect(columnsForWidth(560)).toBe(ICON_GRID.COLS);
    expect(columnsForWidth(ICON_GRID.COLS * ICON_GRID.COL_W)).toBe(ICON_GRID.COLS);
  });

  it('drops columns rather than shrink the tiles on a phone', () => {
    expect(columnsForWidth(304)).toBe(5);
    expect(columnsForWidth(250)).toBe(4);
  });

  it('never goes below a grid', () => {
    expect(columnsForWidth(120)).toBe(ICON_GRID.MIN_COLS);
  });

  it('assumes the drawn width before the container has been measured', () => {
    expect(columnsForWidth(0)).toBe(ICON_GRID.COLS);
  });
});

describe('a narrower grid', () => {
  it('reflows the tiles into the columns it has', () => {
    expect(iconTilePosition(5, 5)).toEqual({ top: ICON_GRID.ROW_H, left: 0 });
    expect(iconTilePosition(4, 5)).toEqual({ top: 0, left: 4 * ICON_GRID.COL_W });
  });

  it('needs more rows for the same icons', () => {
    expect(iconGridWindow(100, 0, 5).contentHeight).toBe(20 * ICON_GRID.ROW_H);
    expect(iconGridWindow(100, 0, 8).contentHeight).toBe(Math.ceil(100 / 8) * ICON_GRID.ROW_H);
  });
});

describe('a Polish query that has been declined', () => {
  // The alias table is written in the nominative singular and nobody types
  // that. Every one of these returned nothing before stemming.
  it('finds the same icons as the dictionary form', () => {
    for (const [singular, plural] of [
      ['rower', 'rowery'],
      ['lampa', 'lampy'],
      ['dom', 'domy'],
      ['mlotek', 'mlotki'],
      ['ksiazka', 'ksiazki'],
      ['narzedzia', 'narzedzi'],
      ['zabawki', 'zabawek'],
    ]) {
      const fromPlural = iconPool(TABLER_ICON_NAMES, plural);

      expect(fromPlural.length, `"${plural}" found nothing`).toBeGreaterThan(0);
      expect(fromPlural[0], `"${plural}" ranked differently to "${singular}"`).toBe(
        iconPool(TABLER_ICON_NAMES, singular)[0]
      );
    }
  });

  it('still refuses a word the dictionary has no business matching', () => {
    expect(iconPool(TABLER_ICON_NAMES, 'kosmos')).not.toContain('IconBasket');
    expect(iconPool(TABLER_ICON_NAMES, 'qqzzxx')).toEqual([]);
  });
});

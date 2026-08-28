// The five screen components that live beside their routes under src/app
// rather than in src/components — the item detail view, the new/edit item
// forms, and the login/setup forms. Together with src/components they cover
// every page in the app.
//
// The converter's synth entry only walks cfg.srcDir (src/components), and
// `export * from` would not re-export LoginForm and SetupForm anyway — both
// are default exports. Naming them here puts all five on
// window.HomeItemCatalog like every other component, via cfg.extraEntries.
//
// Each one is re-exported from ./screens/<group>/, and cfg.componentSrcMap
// points at those files rather than at src/app directly. The converter derives
// a component's design-system group from the last directory segment of its
// source path, which for a Next.js route means "id", "new", "edit", "login" or
// "setup" — route names, not design sections. Going through a directory named
// for the group fixes that at the source instead of fighting it downstream.

export { ItemDetailView } from './screens/catalog/ItemDetailView';
export { NewItemForm } from './screens/item-forms/NewItemForm';
export { EditItemForm } from './screens/item-forms/EditItemForm';
export { LoginForm } from './screens/auth/LoginForm';
export { SetupForm } from './screens/auth/SetupForm';

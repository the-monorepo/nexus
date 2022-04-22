pub trait Updater<I> {
    fn update(&mut self, input: I);
    fn unmount(self);
}

pub trait Mounter<UO, U: Updater<UO>> {
    fn mount(self, container: &mut web_sys::Node, before: &web_sys::Node) -> U;
}

pub trait Blueprint<I, UO, U: Updater<UO>, M: Mounter<UO, U>> {
    fn create(&mut self, input: I) -> M;
}

pub trait Renderer {
    fn render_string(&mut self, value: &str);
}
// TODO: Rename.
// The "core" part of the "core"

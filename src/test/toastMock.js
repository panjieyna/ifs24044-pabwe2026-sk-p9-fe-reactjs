// Pengganti ringan Toast UI Editor/Viewer untuk lingkungan JSDOM.
export class FakeEditor {
  static instances = []

  constructor(options) {
    this.options = options
    this.markdown = options.initialValue
    this.destroyed = false
    options.el.innerHTML =
      '<div class="toastui-editor-defaultUI"><div class="toastui-editor-tabs"><div class="tab-item active" aria-role="tab">Write</div></div><div class="toastui-editor-popup" aria-role="dialog"></div><textarea class="toastui-editor-pseudo-clipboard"></textarea></div>'
    FakeEditor.instances.push(this)
  }

  getMarkdown() {
    return this.markdown
  }

  setMarkdown(markdown) {
    this.markdown = markdown
  }

  // Simulasi pengguna mengetik di editor.
  type(markdown) {
    this.markdown = markdown
    this.options.events.change()
  }

  destroy() {
    this.destroyed = true
  }
}

export class FakeViewer {
  static instances = []

  constructor(options) {
    this.options = options
    this.destroyed = false
    this.el = options.el
    this.setMarkdown(options.initialValue)
    FakeViewer.instances.push(this)
  }

  setMarkdown(markdown) {
    this.markdown = markdown
    this.el.textContent = markdown
  }

  destroy() {
    this.destroyed = true
  }
}

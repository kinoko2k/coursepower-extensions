const api = typeof browser !== "undefined" ? browser : chrome;

api.runtime.onInstalled.addListener(() => {
  console.log("CoursePower拡張機能を読み込みました。");
});

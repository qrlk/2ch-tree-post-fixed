// ==UserScript==
// @name         2ch tree post
// @namespace    http://tampermonkey.net/
// @version      1
// @description  делает треды древовидными
// @author       You
// @match        http://2ch.hk/*/res/*
// @match        https://2ch.hk/*/res/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";
  // console.time("tree script");
  //находим все ссылки в постах
  const post = document.querySelectorAll(
    `.post__message > :nth-child(1)[data-num]`
  );

  //функцию вызываем на все посты в треде
  //Перемащает пост и применяет стили для создания дерева
  function postMove(linkPost, newpost = false) {
    const nodePostCurr = linkPost.parentNode.parentNode;
    const nodePostReply = document.querySelector(
      `#post-${linkPost.innerText.match(/\d+/)[0]}`
    );
    //если эта ссылка ведёт на оппост или другой тред или пост не существует - пропускаем
    if (/OP|→/.test(linkPost.innerText) || !nodePostReply) {
      return;
    }

    // контейнер, который имитирует древовидную структуру
    const container = document.createElement('div')
    container.style.cssText = `border-left:2px dashed;padding-left:2px;margin-left:21px;`

    // посты с одиночными картинками отображались некорректно
    const glue = document.createElement('div')
    glue.style.cssText = `display: flex;margin-left:2px;`
  
    glue.append(nodePostCurr)
    container.append(glue)

    // определяем вложенный ли пост или он в корне дерева
    if (nodePostReply.parentNode.style.display === "flex") {
      nodePostReply.parentNode.parentNode.insertBefore(container, nodePostReply.nextSibling)
    } else {
      nodePostReply.parentNode.insertBefore(container, nodePostReply.nextSibling)
    }

    if (newpost) {
      nodePostCurr.style["border-left"] = "5px solid";
      nodePostCurr.addEventListener(
        "click",
        () => {
          nodePostCurr.style["border-left"] = "2px dashed";
        },
        { once: true }
      );
    }
  }
  //перебираем и вызываем функцию
  for (const key of post) {
    postMove(key);
  }

  //наблюдаем за появлением новых постов
  const fromThreads = document.querySelector(".thread");

  const observer = new MutationObserver((mutationRecords) => {
    for (const key of mutationRecords) {
      if (key.addedNodes.length > 0) {
        const post = key.addedNodes[0].querySelector(
          `.post__message > :nth-child(1)[data-num]`
        );
        if (post) {
          postMove(post, true);
        }
      }
    }
  });

  observer.observe(fromThreads, { childList: true });
  // console.timeEnd("tree script");
})();

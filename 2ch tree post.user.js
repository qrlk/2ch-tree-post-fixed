// ==UserScript==
// @name         2ch tree post fixed
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  делает треды древовидными
// @author       You
// @match        http://2ch.hk/*/res/*
// @match        https://2ch.hk/*/res/*
// @homepageURL  https://github.com/qrlk/2ch-tree-post-fixed
// @grant        none
// ==/UserScript==

(function () {
    "use strict";
    // console.time("tree script");
    //находим все ссылки в постах
    const post = document.querySelectorAll(
        `.post__message > :nth-child(1)[data-num]`
    );

    function checkVisible(elm) {
        var rect = elm.getBoundingClientRect();
        var viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
        return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
    }

    // тогл состояния скрытости поста
    function togglePosts(node) {
        let sibling = node.parentNode.firstChild
        let first = node, last = node
        let hideBool = !node.querySelectorAll('.post')[0].classList.contains('post_type_hidden')
        if (node.parentNode.classList.contains("thread")) {
            sibling = node
            // откатываемся к первому потомку корня треда
            while (sibling && sibling.previousSibling && !sibling.previousSibling.classList.contains("post")) {
                sibling = sibling.previousSibling
            }
            first = sibling.previousSibling
            // обходим всё поддерево
            while (sibling && sibling.nextSibling && sibling.tagName === "DIV") {
                sibling.querySelectorAll('.post').forEach(e => {
                    e.classList.toggle('post_type_hidden', hideBool)
                    last = e
                })
                sibling = sibling.nextSibling
            }
        } else {
            sibling.parentNode.querySelectorAll('.post').forEach(e => {
                if (e !== sibling.firstChild) {
                    e.classList.toggle('post_type_hidden', hideBool);
                    last = e
                } else {
                    first = e
                }
            })
        }
        if (!checkVisible(last)) {
            first.scrollIntoView()
            console.log('прокручено к первому элементу, потому что последний элемент не был виден')
        }
    }

    // ловим клик именно по конкретному поддереву
    // определяем небольшую зону на которую нужно реагировать
    function click(e) {
        if ((e.pageX - e.currentTarget.offsetLeft < 20) && (e.pageY - e.currentTarget.offsetTop > 20)) {
            togglePosts(e.currentTarget)
        } else if ((e.pageX - e.currentTarget.offsetLeft < 5) && (e.pageY - e.currentTarget.offsetTop < 20)) {
            togglePosts(e.currentTarget)
        }
    }

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
        container.style.cssText = `border-left:2px dashed #373c3e;padding-left:2px;margin-left:21px;`

        // определяем клик, что свернуть/развернуть поддерево
        container.onclick = click

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
                    nodePostCurr.style["border-left"] = "2px dashed #373c3e";
                },
                {once: true}
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
                    `.thread > .post_type_reply > .post__message > :nth-child(1)[data-num]`
                );
                if (post) {
                    postMove(post, true);
                }
            }
        }
    });

    observer.observe(fromThreads, {childList: true});
    // console.timeEnd("tree script");
})();

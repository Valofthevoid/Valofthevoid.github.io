import { Typist, Drifter, Hex } from "./hex.js";
import { startConversation, chooseOption } from "./kim.js";
import GlobalFlags from "./flags.js";

new Hex("Aoi", "xX GLIMMER Xx", 55);
new Hex("Amir", "H16h V0l7463", 1000);
new Hex("Arthur", "Broadsword", 40);
new Hex("Eleanor", "Salem", 80);
new Hex("Lettie", "Belladona ~{@", 55);
new Hex("Quincy", "Soldja1Shot1kil", 60);

window.System = new Typist("System");
window.GlobalFlags = GlobalFlags;
window.Config = {
    //
}

DOMContentLoaded.then(() => {
    document.getElementById("start").addEventListener("click", startConversation);
    window.Drifter = new Drifter(document.getElementById("username"));
});

window.onload = () => {
    //####################################################
    window.$chatwith = "none";
    window.$username = document.getElementById("username");
    window.$dating = document.getElementById("dating");
    window.$chattopic = document.getElementById("topic");
    window.$selectButtons = document.querySelectorAll(".amog");
    window.$chattitle = document.getElementById("chattitle");
    window.$messageWindow = document.getElementById("chatlog");
    window.$messageStatus = document.getElementById("status");
    window.$optionButtons = [...document.getElementById("options").children];
    window.$flags = [...document.querySelectorAll("[name=flags]")];

    window.$delay = document.getElementById("delay");
    window.$system = document.getElementById("system");
    window.$nosave = document.getElementById("nosave");

    window.$start = document.getElementById("start");

    function updateOptionWidth() {
        let width = $optionButtons[0].clientWidth;
        $optionButtons.forEach((btn) => {
            let diff = btn.children[0].clientWidth - width;
            diff = diff > 5 ? -1 * diff : 0;
            btn.style.setProperty("--slide-distance", `${diff}px`);
        });
    }
    $optionButtons.forEach((btn, idx) => {
        btn.updateTextContent = function (val) {
            this.children[0].textContent = val;
            updateOptionWidth();
        };
        btn.updateTextContent('');
        btn.disabled = true;
        btn.addEventListener('click', () => chooseOption(idx));
    });

    {
        const $optrender = document.getElementById("optrender");
        const $options = document.getElementById("options");

        var lsv = localStorage.getItem("optrender");
        if (lsv)
            $optrender.selectedIndex = lsv;

        $optrender.addEventListener("change", () => {
            localStorage.setItem("optrender", $optrender.selectedIndex);
            updateOptionRenderClass();
        });

        updateOptionRenderClass();

        function updateOptionRenderClass() {
            $options.dataset.render = $optrender.options[$optrender.selectedIndex].textContent.toLowerCase();
            updateOptionWidth();
        }
    }

    //####################################################

    function updateMessagesScrollPosition() {
        let msg = $messageWindow.querySelector("&> :last-child");
        if (msg) msg.scrollIntoView({ block: "end", inline: "nearest" });
    }

    window.addEventListener('resize', function () {
        updateMessagesScrollPosition();
        updateOptionWidth();
    });

    const lockingConfigOptions = [...document.getElementById("config").querySelectorAll("input:not(#system, #delay), select:not(#optrender), button:not(#reload)")];

    window.lockConfig = function () {
        lockingConfigOptions.forEach((el) => el.disabled = true);
    };
    window.unlockConfig = function () {
        lockingConfigOptions.forEach((el) => el.disabled = false);
    };

    const $config = document.getElementById("config");
    const $chat = document.getElementById("chat");
    const $gotoConfig = document.getElementById("gotoConfig");
    const $gotoChat = document.getElementById("gotoChat");

    window.focusChat = function () {
        $gotoChat.disabled = true;
        $config.classList.remove("active");
        $chat.classList.add("active");
        $chat.focus();
        $gotoConfig.disabled = false;
    };
    window.focusConfig = function () {
        $gotoConfig.disabled = true;
        $config.classList.add("active");
        $chat.classList.remove("active");
        $config.focus();
        $gotoChat.disabled = false;
    };

    {
        $flags.forEach((flag) => {
            var lsv = localStorage.getItem(flag.value);
            GlobalFlags.set(flag.value, flag.checked = lsv === "true");
            flag.addEventListener('change', function () {
                localStorage.setItem(this.value, this.checked);
                GlobalFlags.set(this.value, this.checked);
            });
        });
    }

    {
        var lsv = localStorage.getItem("username");
        if (lsv)
            $username.value = lsv;
        $username.addEventListener('change', () => {
            localStorage.setItem("username", $username.value);
        });
    }

    {
        var lsv = localStorage.getItem("dating");
        updateDatingFlags(lsv);
        $dating.addEventListener('change', () => {
            localStorage.setItem("dating", $dating.selectedIndex);
            updateDatingFlags($dating.selectedIndex);
        });

        function updateDatingFlags(value) {
            GlobalFlags.set("IsDating", !!value);
            [...$dating.options].forEach((opt, idx) => {
                if (!idx) return;
                if (idx == value) {
                    opt.selected = true;
                    GlobalFlags.set(`${opt.textContent}Dating`, true);
                }
                else {
                    GlobalFlags.set(`${opt.textContent}Dating`, false);
                }
            });
        }
    }

    {
        var lsv = parseInt(localStorage.getItem("chatwith"));
        var namestonum = [["Aoi", 0], ["Amir", 1], ["Arthur", 2], ["Eleanor", 3], ["Lettie", 4], ["Quincy", 5]];
        if (lsv && !isNaN(lsv))
            var name;
            namestonum.forEach((nameset) => {
                if(nameset[1] == lsv){
                    name = nameset[0];
                    $chatwith = name;
                }
            });
            [...$chattopic.options].slice(1).forEach((opt) => opt.disabled = opt.dataset.whose !== name);

        $selectButtons.forEach(addListener);



        function addListener(value, index) {
            $selectButtons[index].addEventListener('click', () => updateChatTargetTest($selectButtons[index].value));
            console.log($selectButtons[index].value);
        }

        function updateChatTargetTest(name) {
            $chattopic.value = 0;
            $chatwith = name;
            [...$chattopic.options].slice(1).forEach((opt) => opt.disabled = opt.dataset.whose !== name);
            namestonum.forEach((nameset) => {
                if(nameset[0] == name){
                    localStorage.setItem("chatwith", nameset[1]);
                }
            });
        }
    }

    {
        var lsv = parseInt(localStorage.getItem("chattopic"));

        if (!isNaN(lsv))
            $chattopic.options[lsv].selected = true;

        $chattopic.addEventListener('change', () => localStorage.setItem("chattopic", $chattopic.selectedIndex));
    }

    {
        var lsv = localStorage.getItem("system");
        if (lsv) $system.checked = lsv === "true";
        updateSystemMessageVisibility();

        $system.addEventListener('change', () => {
            localStorage.setItem("system", !!$system.checked);
            updateSystemMessageVisibility();
        });

        function updateSystemMessageVisibility() {
            if ($system.checked)
                $messageWindow.classList.remove("hide-system");
            else
                $messageWindow.classList.add("hide-system");
        }
    }

    {
        var lsv = localStorage.getItem("delay");
        if (lsv) $delay.checked = lsv === "true";
        $delay.addEventListener('change', () => {
            localStorage.setItem("delay", !!$delay.checked);
        });
    }

    {
        var lsv = localStorage.getItem("nosave");
        if (lsv) $nosave.checked = lsv === "true";
        $nosave.addEventListener('change', () => {
            localStorage.setItem("nosave", !!$nosave.checked);
        });
    }
};

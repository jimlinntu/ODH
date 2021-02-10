class enen_MerriamWebster {
    constructor() {
        this.options = undefined;
        this.mw_base_url = 'https://www.merriam-webster.com/dictionary/';
        this.mw_audio_base_url = 'https://media.merriam-webster.com/audio/prons/en/us/mp3/';
        this.mw_audio_ext = ".mp3";
    }
    async displayName() {
        return 'Merriam Webster Dictionary';
    }

    async findTerm(word) {
        let results = this.findMWDict(word);
        return results;
    }

    T(node){
        if (!node)
            return '';
        else
            return node.innerText.trim();
    }

    clean_doc(doc){
        // remove Save Word
        let elements = doc.querySelectorAll(".save-to-list") || [];
        for (const e of elements) {
            e.remove();
        }
        return doc;
    }

    // Given the doc (DOM), search if there are pronunciations provided
    get_audios(doc){
        let audios = new Set(); // avoid duplicates
        const elements = doc.querySelectorAll(".entry-attr .play-pron");
        for (const e of elements) {
            const filename = e.getAttribute("data-file");
            const data_dir = e.getAttribute("data-dir");
            const data_lang = e.getAttribute("data-lang");
            // Only allow US style pronunciation
            if (filename && data_dir &&
                    data_lang && data_lang === "en_us" ) {
                // Ex. https://media.merriam-webster.com/audio/prons/en/us/mp3/t/test0001.mp3
                let url = this.mw_audio_base_url + data_dir + "/"+ filename + this.mw_audio_ext;
                audios.add(url);

            }
            // Remove the audio link
            e.remove();
        }
        return Array.from(audios);
    }

    // Given the doc (DOM), get a standard (or deinflect) form of it (called expression here)
    get_expression(doc){
        return this.T(doc.querySelector(".hword"));
    }

    get_definitions(doc){
        /*
         * Typically, the definition section is structued like this:
         * <div class="row entry-header">...</div>
         * <div class="row entry-attr">...</div>
         * <div id="dictionary-entry-1">...</div>
         *
         * Or
         * <div class="row entry-header">...</div>
         * <div class="row headword-row">...</div>
         * <div id="dictionary-entry-1">...</div>
         */

        let definitions = [];
        let def_el = doc.querySelector("#definition-wrapper");
        if (!def_el) {
            return definitions;
        }
        let rows = def_el.children;
        if (rows.length === 0) {
            return definitions;
        }
        let divs = rows[0].children;
        if (divs.length === 0) {
            return definitions;
        }
        let content_divs = divs[0].children;
        if (content_divs.length === 0) {
            return definitions
        }
        // Remove unwanted divs
        let wanted_divs = [];
        for (const div of content_divs) {
            // Only leave: ".row" and "dictionary-entry-[0-9]+"
            if (div.className.includes("row") || div.id.includes("dictionary-entry-")) {
                wanted_divs.push(div);
            }
        }

        if (wanted_divs.length === 0) {
            return definitions;
        }

        // Convert it to html
        let definition = "";
        for (const div of wanted_divs) {
            definition += div.outerHTML;
        }
        definitions.push(definition);
        return definitions;
    }

    async findMWDict(word) {
        let notes = [];
        if (!word) return notes;

        let url = this.mw_base_url + encodeURIComponent(word);

        // Fetch the document of this word
        let doc = null;
        try {
            let data = await api.fetch(url);
            let parser = new DOMParser();
            doc = parser.parseFromString(data, 'text/html');
        } catch (err) {
            return [];
        }

        doc = this.clean_doc(doc);

        // Deinflected form (ex. tests -> test)
        let expression = this.get_expression(doc);
        let audios = this.get_audios(doc);

        let definitions = this.get_definitions(doc);
        let css = this.renderCSS();

        notes.push({
            css,
            expression,
            audios,
            definitions
        });

        return notes;
    }

    renderCSS() {
        let vg_span_font_size = "15px";
        let css = `
            <style>
            h1 {
                color: #303336;
                display: inline;
                font-family: Playfair Display,serif;
                font-size: 48px;
                font-stretch: normal;
                font-style: normal;
                font-weight: 700;
                letter-spacing: 1.2px;
                line-height: 50px;
                padding-right: 15px;
            }

            h2 {
                color: #265667;
                font-family: Open Sans,Helvetica,Arial,sans-serif;
                font-size: 22px;
                font-stretch: normal;
                font-style: normal;
                font-weight: 700;
                line-height: 26px;
                letter-spacing: .3px;
                margin-bottom: .5em;
                padding-bottom: 0;
            }

            .vg-header h2+p.entryNumbers, p.hword2 {
                display: inline;
            }

            p.hword {
                color: #303336;
                display: inline;
                font-family: Playfair Display,serif;
                font-size: 34px;
                font-stretch: normal;
                font-style: normal;
                font-weight: 700;
                height: 36px;
                letter-spacing: .9px;
                line-height: 36px;
                padding-right: 10px;
            }

            p.hword2 {
                display: inline;
            }

            p.hword2 {
                color: #265667;
                font-family: Open Sans,Helvetica,Arial,sans-serif;
                font-size: 22px;
                font-stretch: normal;
                font-style: normal;
                font-weight: 700;
                line-height: 26px;
                letter-spacing: .3px;
                margin-bottom: .5em;
                padding-bottom: 0;
            }

            p a {
                background-image: linear-gradient(90deg,#97bece 100%,transparent 0);
                background-position: 0 1.15em;
                background-repeat: repeat-x;
                background-size: 3px 1px;
                color: #265667;
            }

            h2, p.entryNumbers, p.hword2 {
                color: #265667;
                font-family: Open Sans,Helvetica,Arial,sans-serif;
                font-size: 22px;
                font-stretch: normal;
                font-style: normal;
                font-weight: 700;
                line-height: 26px;
                letter-spacing: .3px;
                margin-bottom: .5em;
                padding-bottom: 0;
            }

            .dro .vr .va, .if {
                font-weight: 700;
            }

            .dro .drp, .dro .ure {
                font-weight: 700;
            }

            .dro {
                padding-left: 33px;
                padding-top: 10px;
            }

            .dro, .list .list-title {
                font-family: Open Sans,Helvetica,Arial,sans-serif;
                font-size: 18px;
                letter-spacing: .2px;
                line-height: 22px;
            }

            .prs, .uros, .vg-ins, .vrs {
                font-size: 18px;
                font-stretch: normal;
                font-style: normal;
                font-weight: 400;
                letter-spacing: .2px;
                line-height: 22px;
            }

            .entry-header .fl, .entry-header .fl a, .entry-header .lbs {
                color: #4a7d95;
                display: inline;
                font-family: Playfair Display,serif;
                font-size: 26px;
                font-stretch: normal;
                font-style: normal;
                font-weight: 700;
                letter-spacing: .5px;
                line-height: 36px;
                text-decoration: none;
            }

            .first-slash, .last-slash, .prt-a {
                color: #225f73;
            }

            .entry-attr {
                font-size: 18px;
                line-height: 22px;
                color: #225f73;
            }

            .entry-attr .word-syllables {
                white-space: pre-wrap;
                overflow-wrap: break-word;
                word-wrap: break-word;
                -ms-word-break: break-all;
                word-break: break-all;
                word-break: break-word;
            }

            .entry-attr .prs, .entry-attr.vrs, .entry-attr .word-syllables {
                font-family: Open Sans,Helvetica,Arial,sans-serif;
            }

            /* ----------------------- */
            /*           .sb           */
            .sb .t {
                display: block;
                padding-top: 10px;
            }
            /* ----------------------- */

            /* <div class="dictionary-entry-1"> */
            .vg-header h2 {
                display: inline;
            }

            /* ----------------------- */
            /*            .vg          */
            /* https://stackoverflow.com/questions/10487292/position-absolute-but-relative-to-parent */
            .vg .sb {
               margin-bottom: 25px;
                position: relative;
            }

            .vg .sb.has-num {
                padding-left: 33px;
            }

            .vg .sb.has-let, .vg .sb.has-subnum {
                padding-left: 66px;
            }

            .vg .num {
               left: 0;
                position: absolute;
                top: 0;
            }

            .vg .sb.has-let .has-num-only, .vg .sb.has-subnum .has-num-only {
                display: inline-block;
                margin-left: -33px;
            }

            .vg .sb.has-let .has-num-only .dtText {
                display: inline!important;
            }

            .vg span {
                font-family: Open Sans,Helvetica,Arial,sans-serif;
                font-size: ${vg_span_font_size};
                font-stretch: normal;
                letter-spacing: .2px;
                line-height: 22px;
            }

            .vg span a {
                background-image: linear-gradient(90deg,#97bece 100%,transparent 0);
                background-position: 0 1.15em;
                background-repeat: repeat-x;
                background-size: 3px 1px;
                color: #265667;
            }

            .vg .t {
                color: #225f73;
                display: block;
                padding-top: 5px;
            }

            .vg .t:before {
                content: "//";
                font-weight: 700;
                padding: 0 4px 0 0;
                color: #4a7d95;
            }

            .vg .letter {
                left: 33px;
                position: absolute;
            }

            .vg .sn {
                font-weight: 700;
            }

            .vg .sb .sense.has-subnum .sub-num {
                left: 66px;
                position: absolute;
            }

            .vg .sb .sense.has-subnum {
                display: block;
                padding: 0 0 10px 33px;
            }

            /* ----------------------- */

            /* ----------------------- */
            /*      row and col        */
            .row {
                display: flex;
                flex-wrap: wrap;
                /* margin-right: -15px;*/
                /* margin-left: -15px; */
            }

            .col {
                flex-basis: 0;
                flex-grow: 1;
                max-width: 100%;
            }

            /* ----------------------- */

            div {
                display: block;
            }
            /* ----------------------- */
            * {
                box-sizing: border-box;
            }
            </style>`;
        return css;
    }
}

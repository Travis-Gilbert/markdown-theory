# raw-html

Uncurated READMEs are full of raw HTML. It must be handled safely (dropped or neutralized), never
break the layout or inject unstyled chrome.

<div align="center">
  <img src="https://example.com/logo.png" width="9999" alt="oversized logo" />
  <h1 style="font-size: 200px">RAW HEADING</h1>
</div>

<table><tr><td>raw cell one</td><td>raw cell two</td></tr></table>

Inline <b>bold</b> and <span style="color:#ff0000">colored</span> spans appear mid-sentence.

<script>document.body.innerHTML = "xss"</script>

Normal paragraph after the HTML, at the normal measure.

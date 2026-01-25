# -
日調ツール

##データ送受信形式

JS→GAS(回答を画面に反映する時)
{action: ,target: ,name:}
GAS→JS(回答を画面に反映する時)
{settings:{startTime: ,endTime: ,stepTime: , dates:},
data:{2/1:{content:[1,0,,,,],comment: },,,}}

JS→GAS（回答送信時）
{action:, target: ,data:{name: ,answer:{2/1:{content:[1,0,,,,] ,comment: },,,}}}
GAS→JS（回答送信時）
{status:}

JS→GAS（集計時）
{action:, target: ,conditions:{gkc:{quorum: , need:["name1",,,]},gkuc:{quorum: , need:["name1",,,]}}}
GAS→JS（集計時）
{settings:{startTime: ,endTime: ,stepTime: , dates:},
data:{2/1:{content:{original:[3,4,,,],result:[true,false,,,]} ,comment: }}}

JS→GAS（投稿時）
{action: ,target:, dates:[]}
GAS→JS(投稿時)
{status:}

JS→GAS（設定更新時）
{action: ,target:, startTime: , endTime: ,stepTime: ,attendees:{[{name: ,origin: ,need:},,,]}}
GAS→JS(設定更新時)
{status:}

JS→GAS（日調削除時）
{action: ,target:}
GAS→JS(日調削除時)
{status:}

JS→GAS（日調作成時）
{action: ,month: ,str: }
GAS→JS(日調作成時)
{status:}

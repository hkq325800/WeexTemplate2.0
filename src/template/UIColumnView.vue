<template>
    <div class="column-view" :tag="tag">
        <list class="left-selection" :style="{ width: leftColumnWidth+'px', borderRightWidth: borderRightWidth+'px', borderRightColor: borderRightColor}">
            <cell v-for="(item,index) in getList" :key="index">
                <column-item @itemClick="touchPage(item,index)" :titleColor="item.titleColor" :borderLeftWidth="item.borderLeftWidth" :borderLeftColor="item.borderLeftColor" :margin="20" :titleSize="item.titleSize" :background="item.background" :title="item.name" :index="index">
                </column-item>
            </cell>
        </list>
        <div class="content" :style="{ width: 750-leftColumnWidth+'px' }">
            <slot></slot>
        </div>
    </div>
</template>
<style scoped>
.column-view {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
}
.cell {
    justify-content: center;
}
.item-title {
    text-align: center;
    text-overflow: ellipsis;
    lines:2;
}
.item {
    justify-content: center;
    align-items: center;
    border-bottom-width:1px;
    border-bottom-color:#dddddd;
}
.left-selection{
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
}
.content{
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
}
</style>
<script>
// let modal = weex.requireModule('modal');
module.exports = {
    props: {
        // option: {
        //  default:{
        //      items:[],
        //      width:240,
        //      selectColor:'#ffffff',
        //      unSelectColor:'#f5f5f5',
        //      titleSize:'36',
        //      // styleName:'',
        //      selectTitleColor:'#333333',
        //      unSelectTitleColor:'#8f8f8f',
        //      borderLeftWidth:'1',
        //      borderLeftColor:'#1c98fc',
        //  }
        // },
        borderRightWidth: { default: 2},
        borderRightColor: { default: 'white'},
        leftColumnWidth: { default:200 },
        items: { default:[] },
        selectColor: { default:'#ffffff' },
        unSelectColor: { default:'#f5f5f5' },
        titleSize: { default:'36' },
        selectTitleColor: { default:'#333333' },
        unSelectTitleColor: { default:'#8f8f8f' },
        borderLeftWidth: { default:'1' },
        borderLeftColor: { default:'#1c98fc' },
    },
    data:()=> ({
        // items: this.items?this.items:[],
        // titleSize: this.titleSize?this.titleSize:'36',
        // styleName: this.styleName?this.styleName:{margin: 20, fontSize: 36},//代替item中的:style
        // leftSelectionWidth: this.width?this.width:200,
        // selectColor: this.selectColor?this.selectColor:'#ffffff',//#ffffff
        // selectTitleColor: this.selectTitleColor?this.selectTitleColor:'#333333',//#333333
        // unSelectColor: this.unSelectColor?this.unSelectColor:'#cccccc',//#cccccc
        // unSelectTitleColor: this.unSelectTitleColor?this.unSelectTitleColor:'white',//#333333
        // borderLeftWidth:this.borderLeftWidth?this.borderLeftWidth:'1',
        // borderLeftColor:this.borderLeftColor?this.borderLeftColor:'#1c98fc',
        list: []
    }),
    created: function() {
        
    },
    computed: {
        // 仅读取
        getList: function () {
            this.list = [];
            this.list.push({
                "name": this.items[0].name,
                "background": this.selectColor,
                "titleColor": this.selectTitleColor,
                "borderLeftWidth": this.borderLeftWidth,
                "borderLeftColor": this.borderLeftColor,
            });
            for(var i = 1; i < this.items.length; i++) {
                this.list.push({
                    "name": this.items[i].name,
                    "background": this.unSelectColor,
                    "titleColor": this.unSelectTitleColor,
                    "borderLeftWidth": '0',
                    "borderLeftColor": this.borderLeftColor,
                });
            }
            return this.list
        },
        
    },
    methods: {
        // getList: function(items){
        //  // modal.toast({message:JSON.stringify(items)})
        //  this.list = [];
        //  this.list.push({
        //      "name": this.items[0],
        //      "background": this.selectColor,
        //      "titleColor": this.selectTitleColor,
        //      "borderLeftWidth": this.borderLeftWidth,
        //      "borderLeftColor": this.borderLeftColor,
        //  });
        //  for(var i = 1; i < this.items.length; i++) {
        //      this.list.push({
        //          "name": this.items[i],
        //          "background": this.unSelectColor,
        //          "titleColor": this.unSelectTitleColor,
        //          "borderLeftWidth": '0',
        //          "borderLeftColor": this.borderLeftColor,
        //      });
        //  }
        //  return this.list;
        // },
        touchPage: function(item, index) {
            var ui = function(){
                for(var i = 0; i < this.items.length; i++) {
                    if(i == index) {
                        this.list[i].background = this.selectColor
                        this.list[i].titleColor = this.selectTitleColor
                        this.list[i].borderLeftColor = this.borderLeftColor
                        this.list[i].borderLeftWidth = this.borderLeftWidth
                    } else {
                        this.list[i].background = this.unSelectColor
                        this.list[i].titleColor = this.unSelectTitleColor
                        this.list[i].borderLeftColor = this.borderLeftColor
                        this.list[i].borderLeftWidth = '0'
                    }
                }
            }.bind(this);
            this.$emit('touchPage', {value: item, index: index, ui: ui});
        },
    },
    components: {
        'column-item': require("./UIColumnItem.vue")
    }
};
</script>

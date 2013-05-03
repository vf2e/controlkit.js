/**
 *
 * controlKit.js - A lightweight controller library
 *
 * controlKit.js is available under the terms of the MIT license.  The full text of the
 * MIT license is included below.
 *
 * MIT License
 * ===========
 *
 * Copyright (c) 2013 Henryk Wollik. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */


ControlKit.CKPanel = function(controlKit,params)
{
    ControlKit.CKEventDispatcher.apply(this,arguments);

    var parent = this._parent = controlKit;

    /*---------------------------------------------------------------------------------*/

    params            = params || {};
    params.valign     = params.valign        || ControlKit.CKDefault.VALIGN;
    params.align      = params.align         || ControlKit.CKDefault.ALIGN;
    params.position   = params.position      || ControlKit.CKDefault.POSITION;
    params.width      = params.width         || ControlKit.CKDefault.WIDTH;
    params.maxHeight  = params.maxHeight     || window.innerHeight;
    params.ratio      = params.ratio         || ControlKit.CKDefault.RATIO;
    params.label      = params.label         || ControlKit.CKDefault.LABEL;

    params.fixed      = params.fixed === undefined ?
                        ControlKit.CKDefault.FIXED :
                        params.fixed;

    /*---------------------------------------------------------------------------------*/

    this._valign    = params.valign;
    this._align     = params.align;
    this._maxHeight = params.maxHeight;
    this._ratio     = params.ratio;
    var   label     = params.label;
    this._width     = Math.max(ControlKit.CKDefault.WIDTH_MIN,Math.min(params.width,ControlKit.CKDefault.WIDTH_MAX));
    this._fixed     = params.fixed;


    /*---------------------------------------------------------------------------------*/

    var rootNode = this._rootNode = new ControlKit.CKNode(ControlKit.CKNodeType.DIV),
        headNode = this._headNode = new ControlKit.CKNode(ControlKit.CKNodeType.DIV),
        lablNode = new ControlKit.CKNode(ControlKit.CKNodeType.SPAN),
        wrapNode = new ControlKit.CKNode(ControlKit.CKNodeType.DIV),
        listNode = this._listNode = new ControlKit.CKNode(ControlKit.CKNodeType.LIST);

    /*---------------------------------------------------------------------------------*/

    controlKit.getRootNode().addChild(rootNode);

    /*---------------------------------------------------------------------------------*/

    rootNode.setStyleClass(ControlKit.CKCSS.Panel);
    headNode.setStyleClass(ControlKit.CKCSS.Head);
    lablNode.setStyleClass(ControlKit.CKCSS.Label);
    wrapNode.setStyleClass(ControlKit.CKCSS.Wrap);
    listNode.setStyleClass(ControlKit.CKCSS.GroupList);

    /*---------------------------------------------------------------------------------*/


    rootNode.setWidth(this._width);
    lablNode.setProperty('innerHTML',label);

    /*---------------------------------------------------------------------------------*/

    if(!this._fixed)
    {
        this._headDragging = false;
        this._mouseOffset  = [0,0];

        headNode.setStyleProperty('cursor','pointer');

        headNode.setEventListener(ControlKit.CKNodeEventType.MOUSE_DOWN,this._onHeadMouseDown.bind(this));
        document.addEventListener(ControlKit.CKDocumentEventType.MOUSE_MOVE,this._onDocumentMouseMove.bind(this));
        document.addEventListener(ControlKit.CKDocumentEventType.MOUSE_UP,  this._onDocumentMouseUp.bind(this));
    }


    /*---------------------------------------------------------------------------------*/

    headNode.addChild(lablNode);
    wrapNode.addChild(listNode);
    rootNode.addChild(headNode);
    rootNode.addChild(wrapNode);

    /*---------------------------------------------------------------------------------*/

    this._position = params.position;
    this._setPosition(params.position[0],params.position[1]);

    this._groups = [];

    /*---------------------------------------------------------------------------------*/


    window.addEventListener('resize',this._onWindowResize.bind(this));
}

/*---------------------------------------------------------------------------------*/

ControlKit.CKPanel.prototype = Object.create(ControlKit.CKEventDispatcher.prototype);

ControlKit.CKPanel.prototype.addGroup  = function(params)
{
    var group = new ControlKit.CKGroup(this,params);
    this._groups.push(group);
    return group;
};

ControlKit.CKPanel.prototype.getGroups     = function(){return this._groups;};
ControlKit.CKPanel.prototype.getNode       = function(){return this._rootNode;};
ControlKit.CKPanel.prototype.getList       = function(){return this._listNode;};


/*---------------------------------------------------------------------------------*
* Panel dragging
*----------------------------------------------------------------------------------*/

ControlKit.CKPanel.prototype._onHeadMouseDown = function()
{
    var nodePos   = this._rootNode.getPositionGlobal(),
        mousePos  = ControlKit.CKMouse.getInstance().getPosition(),
        offsetPos = this._mouseOffset;

    offsetPos[0] = mousePos[0] - nodePos[0];
    offsetPos[1] = mousePos[1] - nodePos[1];

    this._headDragging = true;

    this.dispatchEvent(new ControlKit.CKEvent(this,ControlKit.CKEventType.PANEL_MOVE_BEGIN));
    this.dispatchEvent(new ControlKit.CKEvent(this,ControlKit.CKEventType.INDEX_ORDER_CHANGED),{origin:this});
};

ControlKit.CKPanel.prototype._updatePosition = function()
{
    var mousePos  = ControlKit.CKMouse.getInstance().getPosition(),
        offsetPos = this._mouseOffset;

    var currPositionX = mousePos[0]-offsetPos[0],
        currPositionY = mousePos[1]-offsetPos[1];

    this._setPosition(currPositionX,currPositionY);

    this.dispatchEvent(new ControlKit.CKEvent(this,ControlKit.CKEventType.PANEL_MOVE));
};

ControlKit.CKPanel.prototype._onDocumentMouseMove = function()
{
    if(!this._headDragging)return;
    this._updatePosition();
};

ControlKit.CKPanel.prototype._onDocumentMouseUp = function()
{
    if(!this._headDragging)return;
    this.dispatchEvent(new ControlKit.CKEvent(this,ControlKit.CKEventType.PANEL_MOVE_END));
    this._headDragging = false;
};

ControlKit.CKPanel.prototype._onWindowResize = function()
{
    this._setPosition(this._position[0],this._position[1]);
};

/*---------------------------------------------------------------------------------*/

ControlKit.CKPanel.prototype._setPosition = function(x,y)
{
    var node     = this._rootNode,
        head     = this._headNode,
        position = this._position;

    var maxX = window.innerWidth  - node.getWidth(),
        maxY = window.innerHeight - head.getHeight();

    position[0] = Math.max(0,Math.min(x,maxX));
    position[1] = Math.max(0,Math.min(y,maxY));

    node.setPositionGlobal(position[0],position[1]);
};

ControlKit.CKPanel.prototype._setHeight = function(height)
{

};

ControlKit.CKPanel.prototype.getWidth      = function(){return this._width;};
ControlKit.CKPanel.prototype.getAlignment  = function(){return this._align;};
ControlKit.CKPanel.prototype.getPosition   = function(){return this._position;};

/*---------------------------------------------------------------------------------*/




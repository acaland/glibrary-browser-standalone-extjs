
function example (){
  var myDiv = Ext.get('gLibtestDiv');
  var urlServer='http://glibrary.ct.infn.it/django/';
  var repo='Sitar';
  
  var proxy = new Ext.data.ScriptTagProxy( { url: urlServer+'glib/miguel/' } );
  var reader= new Ext.data.JsonReader({
    root: 'records',
	totalProperty: 'total',
    fields:[
	  { name : 'Name', mapping : 'Name' },
	  { name : 'Surname', mapping : 'Surname' },
      { name : 'Age', mapping : 'Age' },
      { name : 'Direction', mapping : 'Direction' }
	]
  });
  
  var store=new Ext.data.Store({
    id : 'ourRemoteStore',
    proxy: proxy,
	reader: reader
  });
  
  var pagingToolbar = { //1
    xtype : 'paging',
    store : store,
    pageSize : 3,
    displayInfo : true
  }
  /*var grid = new Ext.grid.GridPanel({
    store: store,
	bbar : pagingToolbar,
	columns: [
	  {
	    header: 'First Name',
		width: 100,
		dataIndex: 'Name',
		sortable: true
	  },
	  {
	    header: 'Last Name',
		width: 100,
		dataIndex: 'Surname',
		sortable: true
	  },
	  {
	    header: 'Age',
		width: 60,
		dataIndex: 'Age',
		sortable: true
	  },
	  {
	    header: 'Address',
		width: 120,
		dataIndex: 'Direction',
		sortable: true
	  }
	],
	//renderTo: myDiv,
	width: 400,
	height: 200
  });*/
  
  
  var tree = new Ext.tree.TreePanel({
	//xtype : 'treepanel',
	autoScroll : true,
	loader : new Ext.tree.TreeLoader({ // 1
	  url : urlServer+'mountTree/'+repo+'/', //getTree
	  requestMethod: 'GET',
	  preloadChildren: true
	}),
	root : new Ext.tree.AsyncTreeNode({ // 2
	  text : 'Sitar',
	  id : '0', // deroberto/Entries
	  expanded : true
	}),
	height: 250
  });
  
  var win=new Ext.Window({
    title: tree.root.text,
	width: 100,
	height: 50,
	layout: 'fit'
  });
  
  /*var colProxy = new Ext.data.ScriptTagProxy( { url: 'http://glibrary.ct.infn.it:8000/test/' } );
  var colReader= new Ext.data.JsonReader();
  
  var colStore=new Ext.data.Store({
    id : 'colStore',
    proxy: colProxy,
	reader: colReader
  }).load();
  
  //console.log('metada-> '+colReader.meta.fields);
  var colGrid = new Ext.grid.GridPanel({
    store: colStore,
	columns: colReader.meta.fields,
	//renderTo: myDiv,
	width: 400,
	height: 200
  });*/
  var colGrid,colStore,colReader;
  
  function renderIcon(val) {
    return '<img src="data:image/jpg;base64,'+val+'" height="80"> '+'</a>';
  }
  
  function columnWrap(val){
    return '<div style="white-space:normal !important; font-family: verdana;">'+ val +'</div>';
  }
  
  tree.on('click', function(n){
    var sn = this.selModel.selNode || {}; // selNode is null on initial selection
    if(n.id != sn.id){  // ignore clicks on folders and currently selected node  //n.leaf &&
	  //console.log(n.text+'->'+n.id+'--'+n.attributes.path);
	  
	  //if(n.id==1)
	  {
	    Ext.Ajax.request({  
             url: urlServer+'metadata'+n.attributes.path+'/',  
             method: 'GET',
             success: successAjaxFn=function(response, request) {
			   var jsonData = Ext.util.JSON.decode(response.responseText);
			   //console.log('jsonData-> '+jsonData.metadata.fields);
			   //console.log(jsonData);

			   var jsonReader = new Ext.data.JsonReader(jsonData.metadata);
			   var memoryProxy = new Ext.data.ScriptTagProxy( { url: urlServer+'glib'+n.attributes.path+'/' } );
			   var colStore=new Ext.data.Store({
				   id : 'colStore',
				   reader: jsonReader, //data: arrayData,
				   proxy: memoryProxy //fields: ['FileName','TypeID','CategoryIDs']
				   //reader: colReader=new Ext.data.JsonReader(jsonData.metadata)
				 });
				 var colToolbar = { //1
				   xtype : 'paging',
				   store : colStore,
				   pageSize : 50,
				   displayInfo : true
				 }
				 colStore.load({ // 2
				  params : {
					start : 0,
					limit : 50
				  }
				 });
				 
				var j,arrayData;
				for (j=0;j<jsonData.filters.length;j++){
					if(jsonData.filters[j].type==='list'){
						arrayData= jsonData.filters[j].filterList;
						jsonData.filters[j].store= new Ext.data.ArrayStore({
							//data : arrayData,
							id: '0',
							fields : [jsonData.filters[j].labelField],
							proxy: new Ext.data.MemoryProxy(arrayData)
						});
					}
				}
				var filters = new Ext.ux.grid.GridFilters({
					// encode and local configuration options defined previously for easier reuse
					//encode: encode, // json encode the filter query
					//local: true,   // defaults to false (remote filtering)
					filters: jsonData.filters
				});
				 
			   //if(colGrid===undefined){
			   colGrid = new Ext.grid.GridPanel({
			     bbar: colToolbar,
				 store: colStore,
				 columns: jsonData.columns,
				 loadMask: true,
				 plugins: [filters],
				 //renderTo: myDiv,
				 width: 400,
				 height: 200
			   });
			   
			   //console.log(colGrid.getColumnModel());
			   var column=colGrid.getColumnModel().getColumnById('thumb');
			   console.log(column);
			   //console.log(jsonData.columns);
			   if (column) {
			   	column.renderer=renderIcon;	
			   }
			   
			   
			
			   
			   colGrid.on('rowclick', function(colGrid, rowIndex, e) {
				 var record = colGrid.getStore().getAt(rowIndex);
				 //console.log('row->'+record.get(n.attributes.path+':FILE'));

				var mapwin=Ext.getCmp('myMapWin');
			   	if(!mapwin){
			   		mapwin = new Ext.Window({
					id: 'myMapWin',
					layout: 'fit',
					title: 'Select the replica to download...',
					closeAction: 'hide',
					x: 200,
					y: 100,
					width: 800,
					height: 500,
					//items: earthPanel
					items: {
								xtype: 'gmappanel',
								id: 'my-map',
								zoomLevel: 8,
								gmapType: 'map',
								mapConfOpts: ['enableScrollWheelZoom','enableDoubleClickZoom','enableDragging'],
								mapControls: ['GSmallMapControl','GMapTypeControl','NonExistantControl'],
								setCenter: {
									// set center to Sicily
									lat: 37.675125,
									lng: 13.961975
								}
							}
					});
					var map=Ext.getCmp('my-map');
					map.on('mapready', function() {
									console.log("mapready");
									map.showMarkers();
					});	
				}


				Ext.Ajax.request({
					 url: urlServer+'links2/'+repo+'/'+record.get(n.attributes.path+':FILE')+'/',
					 method: 'GET',
					 success: successFn=function(response, request) {
						var jsonLinks = Ext.util.JSON.decode(response.responseText);
				
							
							var map=Ext.getCmp('my-map');
							map.cache.marker.length = 0;
							map.hideAllInfoWindows();
							//console.log(jsonLinks);
							var markers = [];
							var enableSEicon = "http://glibrary.ct.infn.it/glibrary_new/images/data_storage_verde.png";
							var disabledSEicon = "http://glibrary.ct.infn.it/glibrary_new/images/data_storage_rosso.png"
							for (i=0; i< jsonLinks.length; i++) {
								//console.log(jsonLinks[i].link);
								var link = jsonLinks[i].link.replace('/glibrary/','/django/');
								markers[i] = {
									lat: jsonLinks[i].lat,
									lng: jsonLinks[i].lng,
									marker: {
										title: jsonLinks[i].name,
										infoWindow: {content: link},
										icon: {
											url: jsonLinks[i].enabled === "0"? disabledSEicon : enableSEicon,
											scaledSize: {width:40, height:40}
										}
									}
								}
							}
							//console.log("sono qui");
							//console.log(markers);
							//google.maps.event.addListener(map.getMap(), 'tilesloaded', function() {
							//	console.log("map loaded");
							//});
							mapwin.show();
							map.addMarkers(markers);
							
							
							
							
				
					 },  
					 failure: failureFn=function(response, request) {
					   console.log('Error!');
					 },
					 timeout: 10000,
					 params: {  
						 //node: '1'
					 }
				 });
               });
			   
			   var i,filtro,boton;
			   colGrid.on('filterupdate',function() {
			     for (i=0;i<colGrid.filters.getFilterData().length;i++)
				 {
					//console.log('filtro['+i+']'+colGrid.filters.getFilterData()[i].field);
					filtro = colGrid.filters.getFilterData()[i];
					boton=Ext.getCmp(filtro.field);
					if(boton!==undefined)
						boton.setText(filtro.field+'('+filtro.data.value+')');
					else
						colGrid.getBottomToolbar().add([
						{
						   text: filtro.field+'('+filtro.data.value+')',
						   id: filtro.field,
						   handler: function () {
							 //console.log('quitar filtro '+this.getText());
							 colGrid.filters.getFilter(this.getId()).setActive(false,false);
							 colGrid.getBottomToolbar().remove(this,true);
						   }
						}]);
				 }
				 
				 Ext.Ajax.request({
					 url: urlServer+'test'+n.attributes.path+'/',
					 method: 'GET',
					 success: successFn=function(response, request) {
						var jsonArray = Ext.util.JSON.decode(response.responseText);
						//if(jsonData.filters[i].labelField!=='filter'+filtro.field)
						var vArray;
						for (j=0;j<jsonData.filters.length;j++)
						{
							vArray=jsonArray[j];
							jsonData.filters[j].store.loadData(vArray);
						}
					 },  
					 failure: failureFn=function(response, request) {
					   console.log('Error!');
					 },
					 timeout: 10000,
					 params: { 
						 filterName: jsonData.filters[0].dataIndex,
						 filterData: Ext.util.JSON.encode(colGrid.filters.getFilterData())
					 }
					});
				 
				 
				 var centerReg=Ext.getCmp('center-region');
				 centerReg.doLayout();
			   });
			   
			   colGrid.getBottomToolbar().add([
			   '->',
			   {
				  text: 'Clear All Filters',
				  handler: function () {
				    while(colGrid.filters.getFilterData().length > 0){
						boton=Ext.getCmp(colGrid.filters.getFilterData()[0].field);
						colGrid.getBottomToolbar().remove(boton);
						colGrid.filters.getFilter(boton.getId()).setActive(false,false);
					}
					var centerReg=Ext.getCmp('center-region');
					centerReg.doLayout();
					
					//colGrid.filters.clearFilters();
				  } 
			   }]);
			   
			   for (i=0;i<colGrid.getColumnModel().getColumnCount();i++)
			   {
			     column=colGrid.getColumnModel().getColumnId(i);
				 if(column!=='thumb')
				   colGrid.getColumnModel().setRenderer(i,columnWrap);
			     //column.renderer=columnWrap;
			   }
			   
			   var centerReg=Ext.getCmp('center-region');
			   centerReg.removeAll();
			   centerReg.add(colGrid);
			   centerReg.doLayout();
			   //}
			 },  
             failure: failureAjaxFn=function(response, request) {
			   console.log('Error!');
			 },
             timeout: 10000,
			 params: {  
                 //node: '1'
             }
         });
	  }
    }
  });
  
  //Ext.Viewport.create();
  var myBorderPanel = new Ext.Panel({
    id: 'border-panel',
    renderTo: document.body,
    //width: 1000,
    //autoHeight: true,
    height: 800,
    title: '',
    layout: 'border',
    items: [/*{
        title: '',
        region: 'south',     // position for region
		id: 'south-region',
        height: 100,
        split: false,         // enable resizing
		collapsible: true,
		collapsed: true,
        //minSize: 75,         // defaults to 50
        //maxSize: 150,
        margins: '0 5 5 5'
    },*/{
        // xtype: 'panel' implied by default
        title: '',
        region:'west',
        margins: '5 0 0 5',
        width: 200,
        collapsible: true,   // make collapsible
        cmargins: '5 5 0 5', // adjust top margin when collapsed
        id: 'west-region-container',
        layout: 'fit',
		collapseMode : 'mini',
        //unstyled: true
		items: tree
    },{
        title: 'Center Region',
		id: 'center-region',
        region: 'center',     // center region is required, no width/height specified
        xtype: 'container',
        layout: 'fit',
        margins: '5 5 0 0',
		//items: grid
    }]
  });
  //new Ext.Viewport().add(myBorderPanel);
  //Ext.EventManager.onWindowResize(myBorderPanel.doLayout, myBorderPanel);
  
  /*Ext.StoreMgr.get('ourRemoteStore').load({ // 2
      params : {
        start : 0,
        limit : 3
      }
  });*/

}




//google.load("earth", "1");
//google.load("maps", "2.xx");

Ext.onReady(example);

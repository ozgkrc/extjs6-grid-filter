Ext.define('FilterField.filters.Filter', {
    extend: 'Ext.AbstractPlugin',
    alias: 'plugin.filterfield',

  
    _task: Ext.create('Ext.util.DelayedTask'),
    delay: 300,
    modelFields: [],


    operatorSet: [{
            shortName: 'nf',
            text: 'No Filter',
            fn: ''
        },
        {
            shortName: 'eq',
            allowEmpty: false,
            text: 'Is equal to',
            fn: function (item, field, value) {
                if (value instanceof Date)
                    return item.data[field].getTime() == value.getTime();
                return item.data[field] == value;
            }
        },
        {
            shortName: 'ne',
            allowEmpty: false,
            text: 'Is not equal to',
            fn: function (item, field, value) {
                if (value instanceof Date)
                    return item.data[field].getTime() != value.getTime();
                return item.data[field] != value;
            }
        },
        {
            shortName: 'gte',
            allowEmpty: false,
            text: 'Greater than or equal',
            fn: function (item, field, value) {
                return item.data[field] >= value;
            }
        },
        {
            shortName: 'lte',
            allowEmpty: false,
            text: 'Less than or equal',
            fn: function (item, field, value) {
                return item.data[field] <= value;
            }
        },
        {
            shortName: 'gt',
            allowEmpty: false,
            text: 'Greater than',
            fn: function (item, field, value) {
                return item.data[field] > value;
            }
        },
        {
            shortName: 'lt',
            allowEmpty: false,
            text: 'Less than',
            fn: function (item, field, value) {
                return item.data[field] < value;
            }
        },
        {
            shortName: 'like',
            allowEmpty: false,
            text: 'Contains',
            fn: function (item, field, value) {
                return item.data[field].indexOf(value) != -1;
            }
        },
        {
            shortName: 'nlike',
            allowEmpty: false,
            text: 'Does not contains',
            fn: function (item, field, value) {
                return item.data[field].indexOf(value) == -1;
            }
        },
        {
            shortName: 'sw',
            allowEmpty: false,
            text: 'Starting With',
            fn: function (item, field, value) {
                return item.data[field].startsWith(value);
            }
        },
        {
            shortName: 'nsw',
            allowEmpty: false,
            text: 'Not starting With',
            fn: function (item, field, value) {
                return !item.data[field].startsWith(value);
            }
        },
        {
            shortName: 'ew',
            allowEmpty: false,
            text: 'Ending With',
            fn: function (item, field, value) {
                return item.data[field].endsWith(value);
            }
        },
        {
            shortName: 'new',
            allowEmpty: false,
            text: 'Not ending With',
            fn: function (item, field, value) {
                return !item.data[field].endsWith(value);
            }
        },
        {
            shortName: 'ie',
            allowEmpty: true,
            text: 'Is Empty',
            fn: function (item, field, value, comp) {
                comp.setValue(null);
                comp.disable();
                return item.data[field].toString().trim() === '';
            }
        },
        {
            shortName: 'ine',
            allowEmpty: true,
            text: 'Is Not Empty',
            fn: function (item, field, value, comp) {
                comp.setValue(null);
                comp.disable();
                return item.data[field].toString().trim() !== '';
            }
        }
    ],


    constructor: function (configs) {

        this.delay = configs.delay || this.delay;

        this.callParent(arguments);
    },

    init: function (grid) {

        var me = this,
            columns = grid.columns;
        modelFields = grid.store.model.fields;

        columns.forEach(function (column, index) {

            var modelField = modelFields.find(function (model) {
                return model.name == column.dataIndex;
            });

            if (modelField === undefined)
                return;

            var filter = {};

            if (!column.items)
                Ext.apply(column, {
                    items: []
                });

            switch (modelField.type) {
                case 'string':
                    column.filter = {
                        xtype: 'textfield'
                    };
                    break;
                case 'int':
                case 'float':
                    column.filter = {
                        xtype: 'numberfield'
                    };
                    break;
                case 'date':
                    column.filter = {
                        xtype: 'datefield',
                        format: 'd/m/Y'
                    };
                    break;
                case 'boolean':
                    column.filter = {
                        xtype: 'combobox',
                        store: [
                            [true, 'Yes'],
                            [false, 'No']
                        ],

                    };
                    break;
                default:
                    column.filter = {
                        xtype: 'textfield'
                    };
            }

            Ext.apply(filter, column.filter, {
                width: '100%',
                triggers: {
                    clear: {
                        cls: 'x-form-clear-trigger',
                        hidden: true,
                        handler: function () {
                            this.setValue(null);

                            if (typeof this.clearValue === 'function')
                                this.clearValue();
                        }
                    }
                },
                listeners: {
                    change: {
                        fn: function (field) {
                            me.field = field;
                            if (Ext.isEmpty(field.getValue())) {
                                me._task.delay(me.delay, me.clearFilter, me, [field, field.nextSibling()]);
                            } else {
                                me._task.delay(me.delay, me.applyFilter, me, [field, null, field.nextSibling()]);
                            }
                        }
                    },
                    added: function (field) {
                        var button = me.getFilterButton(field);
                        field.ownerCt.insert(1, button);
                    }
                }
            });

            var itemsToBeAdded = [filter];

            column.insert(0, Ext.create('Ext.container.Container', {
                width: '100%',
                items: itemsToBeAdded,
                padding: '0 10px',
                layout: {
                    type: 'table',
                    tdAttrs: {
                        valign: 'top'
                    }
                },
                listeners: {
                    scope: me,
                    element: 'el',
                    mousedown: function (e) {
                        e.stopPropagation();
                    },
                    click: function (e) {
                        e.stopPropagation();
                    },
                    dblclick: function (e) {
                        e.stopPropagation();
                    },
                    keydown: function (e) {
                        e.stopPropagation();
                    },
                    keypress: function (e) {
                        e.stopPropagation();
                    },
                    keyup: function (e) {
                        e.stopPropagation();
                    }
                }
            }));

        });

    },


    getFilterButton: function (field) {
        var me = this;

        var filtersToBeApplied = [];
        if (field.xtype == 'textfield')
            filtersToBeApplied = ['nf', 'eq', 'ne', 'sw', 'nsw', 'like', 'nlike', 'ew', 'new', 'ie', 'ine'];
        else if (field.xtype == 'datefield')
            filtersToBeApplied = ['nf', 'eq', 'ne', 'lt', 'lte', 'gt', 'gte', 'ie', 'ine'];
        else if (field.xtype == 'numberfield')
            filtersToBeApplied = ['nf', 'eq', 'ne', 'lt', 'lte', 'gt', 'gte', 'ie', 'ine'];
        else
            filtersToBeApplied = ['nf', 'eq', 'ne', 'sw', 'nsw', 'like', 'nlike', 'ew', 'new', 'ie', 'ine'];

        //Only required filters
        var menuItems = this.operatorSet.map(function (op) {
            if (filtersToBeApplied.includes(op.shortName)) {
                return {
                    text: op.text,
                    filter: op,
                    listeners: {
                        click: function (menuItem) {
                            var filterButton = this.ownerCt.ownerCmp;
                            if (menuItem.filter.fn !== "") {
                                me.applyFilter(field, menuItem.filter, filterButton);
                            } else {
                                me.clearFilter(field, filterButton);
                            }
                        }
                    }
                };
            }
        });

        var filterMenu = Ext.create('Ext.menu.Menu', {
            items: menuItems,
            plain: true
        });

        var button = Ext.create('Ext.Button', {
            iconCls: 'fa fa-filter',
            arrowVisible: false,
            menu: filterMenu
        });

        return button;
    },

    clearFilter: function (field, button) {

        var column = field.ownerCt.ownerCt,
            grid = column.up('grid');

        if (field.isDisabled())
            field.enable();
        grid.getStore().removeFilter(column.dataIndex);
        field.triggers.clear.el.hide();
        column.setText(column.textEl.dom.firstElementChild.innerText);
        field.operator = '';
        field.setValue(null);
        button.removeCls('filter-button-active');
        button.menu.items.items.forEach(function (item) {
            if (item.hasCls('filter-button-active'))
                item.removeCls('filter-button-active');
        });
    },

    applyFilter: function (field, filter, button) {

        var me = this,
            column = field.ownerCt.ownerCt,
            grid = column.up('grid');

        if (filter === undefined || filter === null)
            filter = me.getDefaultOperator(column);

        if (field.getValue() === null && !filter.allowEmpty)
            return;

        field.triggers.clear.el.show();

        //Style settings when filter is applied
        column.setText('<strong><em>' + column.text + '</em></strong>');
        button.addCls('filter-button-active');
        var menuItems = button.menu.items.items;
        menuItems.forEach(function (item) {
            if (item.hasCls('filter-button-active'))
                item.removeCls('filter-button-active');
        });
        menuItems.find(function (item) {
            return item.text == filter.text;
        }).addCls('filter-button-active');

        grid.getStore().addFilter(new Ext.util.Filter({
            id: column.dataIndex,
            filterFn: function (item) {
                var fn = filter.fn;
                return fn(item, column.dataIndex, field.getValue(), field);
            }
        }));
    },

    /**
     * Get the default filter operator for a column
     */
    getDefaultOperator: function (column) {
        if (column.filter.xtype == 'textfield')
            return this.operatorSet.find(function (op) {
                return op.shortName == 'like';
            });

        if (column.filter.xtype == 'combobox')
            return this.operatorSet.find(function (op) {
                return op.shortName == 'eq';
            });

        return this.operatorSet.find(function (op) {
            return op.shortName == 'eq';
        });
    }
});
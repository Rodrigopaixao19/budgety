// Budget Controller
var budgetController = (function(){

    var Expense = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    Expense.prototype.calcPercentage =  function(totalIncome){

        if(totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }
    };

    Expense.prototype.getPercentage = function() {
        return this.percentage;
    }


    var Income = function (id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    var calculateTotal = function (type) {
        var sum = 0;
        data.allItems[type].forEach(function(cur){
            sum += cur.value;
        });
        
        /*
            Initial Sum = 0
            Sums = Then [200, 400, 100]
            sum = 0 + 200
            sum = 200 + 400
            sum = 600 + 100 = 700
        */
        data.totals[type] = sum;
    };

    var data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1 // -1 is usually a value to tell that something is non existant
    };

   
    return {
        addItem: function(type, des, val) {
            var newItem, ID;

            // first we'd have ids like this [1,2,3,4,5,6] next id = 7
            // but then we can delete items from the ui so [1,2,4,6,8] next id = 9
            // So the ID will be ID = LAST ID + 1

            // IF there an id bigger the 0(first value) then start adding from 1
            if(data.allItems[type].length > 0) {
                ID = data.allItems[type][data.allItems[type].length- 1].id + 1;
            } else {
                // If not the first should be 0
                ID = 0;
            }
            

            // create new item based on 'inc' or 'exp' type
            if(type === 'exp') {
                newItem = new Expense(ID, des, val);
            } else if (type === 'inc') {
                newItem = new Income (ID, des, val);
            }

            // pushing to our new data structure
            data.allItems[type].push(newItem);

            // return the new element
            return newItem;
            
        },

        deleteItem: function(type, id) {
            // Ids [1 2 4 6 8]
            // i want to delete id 6
            // so the index of 6 is 3
            var ids = data.allItems[type].map(function(current){
                return current.id;
            });

            var index = ids.indexOf(id);//index of shows the index position of the current element we just mapped so the var index becomes this index

            // Delete item from the array using splice (splice is used to remove elements)
            if(index !== -1) {
                data.allItems[type].splice(index, 1) // splice 1 argument receives the position of the element we want to start deleting, the 2 argument is how many of them we want to delete
            }
        },

        calculateBudget: function () {

            // Calculate the sum of all incomes and expenses
            calculateTotal('exp');
            calculateTotal('inc');

            // Calculate the budget: incomes - expenses
            data.budget = data.totals.inc - data.totals.exp;

            // Calculate the percentage of income that it was spent
            if(data.totals.inc > 0) {
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100); // exp 100 inc 200 = spent 50% of our income  that is 100/200 = 0.5 * 100
            } else {
                data.percentage = -1;
            }
        },

        calculatePercentages: function(){
            /*
            expense a = 20
            expense b = 10
            expense c = 40

            income = 100

            expense a / income (20/100) = 20%
            expense b / income (10/100) = 10%
            expense c / income (40/100) = 40%
            */ 


            data.allItems.exp.map(function(cur){
                cur.calcPercentage(data.totals.inc);
            });
        },

        getPercentages: function() {
            var allPerc = data.allItems.exp.map(function(cur){
                return cur.getPercentage();
            });

            return allPerc;
        },

        getBudget: function() {
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            };
        },

        testing: function () {
            console.log(data);
        }
    };

    
})();





// UI Controller
var UIController = (function(){


/********************************** Class names  **************************************************/    
    var DOMstrings = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        incomeContainer: '.income__list',
        expensesContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expensesPercLabel: '.item__percentage',
        dateLabel: '.budget__title--month'
    };
/********************************** End Class names**************************************************/      

    var formatNumber = function(num, type) {
     var numSplit, int, dec, type;
        // + or - before a number exactly 2 decimal points and a comma separating the thousands 2310,4567 -> +2,310.46 or 2000 -> 2,000.00
    
        num = Math.abs(num) // .abs remove the sign of the number
        num = num.toFixed(2); //.toFixed is a method of the number prototype and it works

        numSplit = num.split('.');

        int = numSplit[0];
        if(int.length > 3) {
        int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3);//input 23010 output 2,310,00 // substring allows us to take only a part of a string, 1 arg is the index where we want to start and 2 arg is how many characters we want
    }

        dec = numSplit[1];

        return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;
}

/********************************** OWN FOREACH**************************************************/      
var nodelistForEach = function(list, callback) {
    for(var i = 0; i < list.length; i++) {
        callback(list[i], i);
    }
};
/********************************** END OWN FOREACH**************************************************/      




/**********************************  Public method/function to get input values from the UI **************************************************/  
    return {
        getInput: function(){
            return {
                type: document.querySelector(DOMstrings.inputType).value, // it will be either inc or exp
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
            };
        },

        addListItem: function(obj, type) {
            var html, newHtml, element;
            // Create HTML string with placeholder text

            if(type === 'inc') {
                element = DOMstrings.incomeContainer;
                html = `<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete">
                <button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>`;
            } else if( type === 'exp') {
                element = DOMstrings.expensesContainer;
                html =  ` <div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div>
                <div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>`
            }
          
            // Replace the placeholder text with actual data
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

            // Insert the HTML into the DOM
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
        },

        deleteListItem: function(selectorID){
            var el;

            el = document.getElementById(selectorID);
            el.parentNode.removeChild(el);
        },

/******  Clear Fields *****/  

        clearFields:function (){
            var fields, fieldsArr;
            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);

            // Convert our list to an array with Slice (slice returns a copy of the array), but before we need to use call

            fieldsArr = Array.prototype.slice.call(fields); // call returns an array
            fields.forEach(function(current, index, array){
                current.value = '';
            }); // pass a callback function and it can receive up to 3 arguments, we have access to the object, we have access to the current value(value of the array being process), index number of the length of the array, and the entire array

            fieldsArr[0].focus();
        },         
 /******  Display Budget on the UI *****/        
            displayBudget: function(obj){
            var type;

            obj.budget > 0 ? type = 'inc' : type = 'exp;'

            document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
            document.querySelector(DOMstrings.expensesLabel).textContent = formatNumber(obj.totalExp, 'exp');

            if(obj.percentage > 0 ) {
                document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + '%';
            } else {
                document.querySelector(DOMstrings.percentageLabel).textContent = '---';
            }
        },

        displayPercentages: function(percentages){
            var fields = document.querySelectorAll(DOMstrings.expensesPercLabel);

            // WTF?????
           
            // WTF??
            nodelistForEach(fields, function(current, index){
                if(percentages[index] > 0) {
                    current.textContent = percentages[index] + '%';
                } else {
                    current.textContent = '---';
                }
            });
        },

        displayMonth: function (){
            var now, year, month, months;
            now = new Date();

            months =['January', 'February,', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            month = now.getMonth();
            year = now.getFullYear();
            document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;
        },

        changeType: function(){
            var fields = document.querySelectorAll(
                DOMstrings.inputType + ',' +
                DOMstrings.inputDescription + ',' +
                DOMstrings.inputValue
            );

            nodelistForEach(fields, function(cur){
                cur.classList.toggle('red-focus');
            });     
            document.querySelector(DOMstrings.inputBtn).classList.toggle('red');
        },


        getDomstrings: function () {
            return DOMstrings;
        }
    };
 
/**********************************  END Public method/function to get input values from the UI and return as public so i can use in the APP CONTROLLER **************************************************/   

})();











// Global APP controller that connects both modules
var controller = (function(budgetCtrl, UICtrl){


/**********************************  SETUP EVENT LISTENERS, BRING THE DOM GETTER FROM THE UI CONTROLLER  **************************************************/
    var setupEventListeners = function() {
        var DOM = UICtrl.getDomstrings();

        document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem); // callback

        document.addEventListener('keypress', function(event){

            if(event.keyCode === 13 || event.which === 13) {
                ctrlAddItem();   
            }
        });

        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changeType);
    };
/**********************************    END OF FUNCTION       **************************************************/

/**********************************    Calculate Budget      **************************************************/


   var updateBudget = function () {

    // 1 Calculate the budget
    budgetCtrl.calculateBudget();

    // 2 Return the budget
    var budget = budgetCtrl.getBudget();

    // 3 Display budget on the UI
    UICtrl.displayBudget(budget);

   };

/**********************************   End Calculate Budget    **************************************************/

/**********************************   Update Budget    **************************************************/
   var updatePercentages = function(){
        // 1. Calculate perentages
        budgetCtrl.calculatePercentages();
        // 2. Read percentages from the budget controller
        var percentages = budgetCtrl.getPercentages();
        // 3. Update the user interface with the new percentages
        UICtrl.displayPercentages(percentages);
   };

/**********************************  End Update Budget    **************************************************/


/**********************************  Get input from the ui controller  **************************************************/
    var ctrlAddItem = function() {
        var input, newItem;
        // 1. Get the field input data
        input = UICtrl.getInput();


        // It prevents empty inputs in the description as well in the value field, values that are not numbers or just 0
        if(input.description !== "" && !isNaN(input.value) && input.value > 0) {
             // 2. Add item to the budgetController
        newItem = budgetCtrl.addItem(input.type, input.description, input.value);
        // 3. Add the new item to the user interface
        UICtrl.addListItem(newItem, input.type);

        // 4. Clear the input fields
        UICtrl.clearFields(input.description, input.value); 

        // 5. Calculate and Update Budget
        updateBudget();
        }

        // 6. Calculate and update percentages
        updatePercentages();
    };
/**********************************  END OF CtrlAddItem **************************************************/

/**********************************  Delete Item **************************************************/

    var ctrlDeleteItem = function(event) {
        var itemID, splitID, type, ID;
        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
        if(itemID){
            // inc -1
            splitID = itemID.split('-');
            type = splitID[0];
            ID = parseInt(splitID[1]);


            // 1. Delete the Item from the data structure
            budgetCtrl.deleteItem(type, ID);
            // 2. Delete the item from the user interface
            UICtrl.deleteListItem(itemID);
            // 3. Update and show the new budget
            updateBudget();

            // 4. Calculate and update percentages
            updatePercentages();
        }
    };

/**********************************  End delete Item **************************************************/



/********************************** PUBLIC INIT FUNCTION**************************************************/  
    return {
        init: function () {
            console.log('App has started');
            UICtrl.displayMonth();
            UICtrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: -1
            });
                   
             // Reset everything
        

            // Init event listeners as soon as we call init (outside of the controllers)
            setupEventListeners();
        }
    }
/********************************** PUBLIC INIT FUNCTION**************************************************/  

})(budgetController, UIController);

controller.init();


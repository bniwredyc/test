'use strict';

//Реализация класса Vector.

class Vector {
  constructor(x, y) {
    // лучше задать как параметры по-умолчанию в аргументах
    this.x = x || 0;
    this.y = y || 0;
  }
  
  plus(vector) {
    // тут лучше обратить условие, бросить ислючение, если параметр неправильный и убрать else
    if (vector instanceof Vector) {
      // можно в одну строчку
      let x = this.x + vector.x;
      let y = this.y + vector.y;
      return new Vector(x, y);
    } else {
      throw new Error('Можно прибавлять к вектору только вектор типа Vector');
    }
  }
  
  times(factor) {
    // если значения не меняются лучше использовать const
    // здесь можно в одну строчку
    let x = this.x * factor;
    let y = this.y * factor;
    return new Vector(x, y);
  }
}

//Реализация класса движущегося объекта.

class Actor {
  constructor(pos, size, speed) {
    // лучше сначала проверить все параметры, а потом просто присвоить значения полям объекта
    if (pos instanceof Vector) {
      this.pos = pos;
    } else if (pos === undefined) {
      // лучше через параметр по умолчанию
      this.pos = new Vector(0, 0);
    } else {
      throw new Error('Переданные координаты не являются объектом типа Vector');
    }
    
    if (size instanceof Vector) {
      this.size = size;
    } else if (size === undefined) {
      this.size = new Vector(1, 1);
    } else {
      throw new Error('Переданный размер не является объектом типа Vector');
    }
    
    if (speed instanceof Vector) {
      this.speed = size;
    } else if (speed === undefined) {
      this.speed = new Vector(0, 0);
    } else {
      throw new Error('Переданная скорость не является объектом типа Vector');
    }
//    this.act = function () {};
  }
  
  get type() {
    return 'actor';
  }
  
  get left() {
    return this.pos.x;
  }
  
  get top() {
    return this.pos.y;
  }
  
  get right() {
    return this.pos.x + this.size.x;
  }
  
  get bottom() {
    return this.pos.y + this.size.y;
  }
  
  act() {}
  
  isIntersect(actor) {
    // проверка на undefined лишняя
    // лучше обратить условие и убрать else
    if (actor !== undefined && actor instanceof Actor) {
      if (actor === this) {
        return false;
      // else тут не нужен
      // я бы разбил на 4 if - более понятно
      } else if (actor.left >= this.right || actor.top >= this.bottom || actor.right <= this.left || actor.bottom <= this.top) {
        return false;
      // тут тоже else не нужен
      } else {
        return true;
      }
    } else {
      throw new Error('Переданный объект не является экземпляром Actor.');
    }
  }
}

// Реализация класса Level.

class Level {
  constructor (grid, actors) {
    // тут нужно упростить всё :)
    if (grid instanceof Array) {
      this.grid = grid;
      this.height = grid.length;
      let max = 0;
      grid.forEach(function (elem) {
        if (elem instanceof Array) {
          if (max < elem.length) {
            max = elem.length;
          }
        }
      });
      this.width = max;
    } else {
      this.grid = [[]];
      this.height = 0;
      this.width = 0;
    }
    if (actors instanceof Array) {
      this.actors = actors;
    } else {
      this.actors = [];
    }
    this.player = this.actors.find(actor => actor.type == "player");
    this.status = null;
    this.finishDelay = 1;
  }
  
  isFinished() {
    // тут выражение можно написать сразу после return
    if (this.status !== null && this.finishDelay < 0) {
      return true;
    }
    return false;
  }
  
  actorAt(actor) {
    // проверка на undefined лишняя
    if (actor !== undefined || actor instanceof Actor) {
      let obj = this.actors.find(elem => {
        // тут должен использоваться метод isIntersect
        if (elem !== actor && actor.pos.x === elem.pos.x && actor.pos.y === elem.pos.y) {
          return elem;
        }
      });
      return obj;
    }
  }
  
  obstacleAt(nextPos, size) {
    if (nextPos instanceof Vector && size instanceof Vector) {
      if (nextPos.x < 0 || nextPos.y < 0 || (nextPos.x + size.x) > this.width) {
        return 'wall';
      } else if ((nextPos.y + size.y) > this.height) {
        return 'lava';
      } else {
        let x = Math.ceil(nextPos.x);
        let y = Math.ceil(nextPos.y);
        return this.grid[y][x];
      }
    }
  }
  
  removeActor(actor) {
    let i = this.actors.findIndex(elem => actor === elem);
    // findIndex вернёт -1, если ничего не найдёт
    if(i !== undefined) {
      this.actors.splice(i, 1);
    }
  }
  
  noMoreActors(type) {
    // лучше проверить длину массива и использовать метод some
    let elem = this.actors.find(elem => elem.type === type);
    if (elem === undefined) {
      return true;
    } else {
      return false;
    }
  }
  
  playerTouched(obstacle, coin) {
    // обратить условие и уменьшить вложенность
    if (this.status === null) {
      if (obstacle === 'lava' || obstacle === 'fireball') {
        this.status = 'lost';
      } else if (obstacle === 'coin') {
        this.removeActor(coin);
        if (this.actors.find(elem => elem.type === 'coin') === undefined) {
          this.status = 'won';
        }
      }
    }
  }
}

// Парсер уровня.

class LevelParser {
  constructor (dictionary) {
    this.dictionary = dictionary;
    this.obstacle = {
      'x': 'wall',
      '!': 'lava'
    };
  }
  
  actorFromSymbol(symbol) {
    // можно заменить на return this.dictionary[symbol];
    if (symbol === undefined) {
      return undefined;
    } else {
      return this.dictionary[symbol];
    }
  }
  
  obstacleFromSymbol(symbol) {
    return this.obstacle[symbol];
  }
  
  createGrid(arr) {
    let obstacle = this.obstacle;
    let grid = arr.map(elem => elem.split(''));
    function rename(elem) {
      elem = obstacle[elem];
      return elem;
    }
    for (let i = 0; i < grid.length; i++) {
      // короче и понятнее будет, если здесь использовать стрелочную функцию
      grid[i] = grid[i].map(rename);
    }
    return grid;
  }
  
  createActors(arr) {
    const dictionary = this.dictionary;
    if (dictionary === undefined || arr.length === 0) {
      return [];
    // else не нужен - елси зашли в if уже вернулся результат
    } else {
      let actors = [];
      let array = arr.map(elem => elem.split(''));
      array.forEach(function (elem, y) {
        for (let x = 0; x < elem.length; x++) {
          // dictionary[elem[x] лучше вынести в переменную
          // нужно проверить, что сожанный объект является объектом класса Actor или его наследника
          if (dictionary[elem[x]] !== undefined) {
            actors.push(new dictionary[elem[x]](new Vector(x, y)));
          }
        }
      });
      return actors;
    }
  }
  
  parse(arr) {
    const grid = this.createGrid(arr);
    const actors = this.createActors(arr);
    return new Level(grid, actors);
  }
}

// Шаровая молния. 

class Fireball extends Actor {
  constructor(pos, speed) {
    // тут должен быть только вызов базового конструктора
    super();
    pos === undefined ? this.pos = new Vector(0, 0) : this.pos = pos;
//    this.pos = pos || new Vector(0, 0);
    this.size = new Vector(1, 1);
    speed === undefined ? this.speed = new Vector(0, 0) : this.speed = speed;
//    this.speed = speed || new Vector(0, 0);
  }
  
  get type() {
    return "fireball";
  }
  
  getNextPosition(time = 1) {
    // скобки не нужны, у умножения больший приоритет выполнения
    const x = this.pos.x + (this.speed.x * time);
    const y = this.pos.y + (this.speed.y * time);
    return new Vector(x, y);
  }
  
  handleObstacle() {
    this.speed = new Vector(-this.speed.x, -this.speed.y);
  }
  
  act(time, level) {
    const nextPosition = this.getNextPosition(time);
    // obstacle - более удачное название переменной (getObstacle похоже на имя функции)
    const getObstacle = level.obstacleAt(nextPosition, this.size);
    // можно писать просто if (getObstacle)
    if (getObstacle === undefined) {
      this.pos = nextPosition;
    } else {
      this.handleObstacle();
    }
  }
}

// Описание горизонтальной и вертикальной шаровых молний. 

class HorizontalFireball extends Fireball {
  constructor (pos) {
    // тут должен быть только вызов базового конструктора
    super();
    this.pos = pos;
    this.size = new Vector(1, 1);
    this.speed = new Vector(2, 0);
  }
}

class VerticalFireball extends Fireball {
  // тут должен быть только вызов базового конструктора
  constructor (pos) {
    super();
    this.pos = pos;
    this.size = new Vector(1, 1);
    this.speed = new Vector(0, 2);
  }  
}

//Описание Огненного дождя. 

class FireRain extends Fireball {
  constructor(pos) {
    // pos size speed должны задаваться через вызов базового конструктора
    super();
    this.startPos = pos;
    this.pos = pos;
    this.size = new Vector(1, 1);
    this.speed = new Vector(0, 3);
  }
  
  handleObstacle() {
    this.pos = this.startPos;
  }
  
  act(time, level) {
    const nextPosition = this.getNextPosition(time);
    // obstacle
    const getObstacle = level.obstacleAt(nextPosition);
    // тут должен использоваться метод handleObstacle
    // вернее тут дублирование кода, act должен быть только в базовом классе
    if (getObstacle === undefined) {
      this.pos = nextPosition; 
    } else {
      this.pos = this.startPos;
    }
  }
}

// Описание монеты.

class Coin extends Actor {
  constructor(pos) {
    // pos, size должны задаваться через базовый конструктор
    super();
    pos === undefined ? this.basePosition = new Vector(0, 0) : this.basePosition = pos;
    this.pos = this.basePosition.plus(new Vector(0.2, 0.1));
    this.size = new Vector(0.6, 0.6);
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = +(Math.random() * 2 * Math.PI).toFixed(2);
  }
  
  get type() {
    return 'coin';
  }
  
  updateSpring(time = 1) {
    // скобки не нужны
    this.spring = this.spring + (this.springSpeed * time);
  }
  
  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }
  
  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.basePosition.plus(this.getSpringVector());
  }
  
  act(time) {
    let newPosition = this.getNextPosition(time);
    this.pos = new Vector(newPosition.x, newPosition.y);
  }
}

// Описание игрока. 

class Player extends Actor {
  constructor(pos) {
    // pos, size, speed должны задаваться через базовый конструктор
    super();
    pos === undefined ? this.pos = new Vector(0, 0).plus(new Vector(0, -0.5)) : this.pos = pos.plus(new Vector(0, -0.5));
    this.size = new Vector(0.8, 1.5);
    this.speed = new Vector(0, 0);
  }
  
  get type() {
    return 'player';
  }
}

// Тестовый уровень.

const schema = [
  'v       |',
  '         ',
  '    =    ',
  '         ',
  '     !xxx',
  ' @ox     ',
  'xxxx!    ',
  '         '
];
const actorDict = {
  '@': Player,
  'o': Coin,
  '=': HorizontalFireball,
  '|': VerticalFireball,
  'v': FireRain
}
const parser = new LevelParser(actorDict);
const level = parser.parse(schema);
runLevel(level, DOMDisplay);
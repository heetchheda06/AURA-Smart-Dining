const Cart = require('../models/Cart');
const WaiterRequest = require('../models/WaiterRequest');
const Table = require('../models/Table');

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Join a dining table room
    socket.on('table:join', async ({ tableNum, name }) => {
      const roomName = `table_room_${tableNum}`;
      socket.join(roomName);
      socket.tableNum = tableNum;
      socket.userName = name || 'Guest';
      
      console.log(`Socket ${socket.id} (${socket.userName}) joined ${roomName}`);

      // Notify other diners in the table room
      socket.to(roomName).emit('user:joined', {
        name: socket.userName,
        message: `${socket.userName} joined the table.`
      });

      // Send the current cart status directly to the newly connected socket
      try {
        const cart = await Cart.findOne({ tableNum }).populate('items.menuItem');
        if (cart) {
          socket.emit('cart:updated', cart);
        }
      } catch (err) {
        console.error('Error fetching table cart on connection:', err.message);
      }
    });

    // Handle leaving a table
    socket.on('table:leave', () => {
      if (socket.tableNum) {
        const roomName = `table_room_${socket.tableNum}`;
        socket.leave(roomName);
        socket.to(roomName).emit('user:left', {
          name: socket.userName,
          message: `${socket.userName} left the table.`
        });
        console.log(`Socket ${socket.id} left table room ${roomName}`);
        socket.tableNum = null;
      }
    });

    // Join Staff / Waiter monitoring room
    socket.on('staff:join', () => {
      socket.join('staff_room');
      console.log(`Staff socket registered: ${socket.id}`);
    });

    // Join Admin room
    socket.on('admin:join', () => {
      socket.join('admin_room');
      console.log(`Admin socket registered: ${socket.id}`);
    });

    // Collaborative Cart Event: Add Item
    socket.on('cart:add', async ({ tableNum, menuItemId, name, price, addedBy }) => {
      try {
        let cart = await Cart.findOne({ tableNum });
        if (!cart) {
          cart = await Cart.create({ tableNum, items: [] });
        }

        const existingIndex = cart.items.findIndex(
          (item) => item.menuItem.toString() === menuItemId
        );

        if (existingIndex > -1) {
          cart.items[existingIndex].qty += 1;
        } else {
          cart.items.push({
            menuItem: menuItemId,
            name,
            price: Number(price),
            qty: 1,
            addedBy: addedBy || 'Someone'
          });
        }

        await cart.save();
        const populatedCart = await Cart.findOne({ tableNum }).populate('items.menuItem');
        
        // Broadcast the updated cart to all diners at the table (including sender)
        io.to(`table_room_${tableNum}`).emit('cart:updated', populatedCart);
      } catch (err) {
        console.error('Socket cart:add error:', err.message);
        socket.emit('error', { message: 'Failed to add item to collaborative cart.' });
      }
    });

    // Collaborative Cart Event: Update Qty
    socket.on('cart:update', async ({ tableNum, menuItemId, delta }) => {
      try {
        const cart = await Cart.findOne({ tableNum });
        if (!cart) return;

        const itemIndex = cart.items.findIndex(
          (item) => item.menuItem.toString() === menuItemId
        );

        if (itemIndex > -1) {
          cart.items[itemIndex].qty += Number(delta);
          if (cart.items[itemIndex].qty <= 0) {
            cart.items.splice(itemIndex, 1);
          }
          await cart.save();
        }

        const populatedCart = await Cart.findOne({ tableNum }).populate('items.menuItem');
        io.to(`table_room_${tableNum}`).emit('cart:updated', populatedCart);
      } catch (err) {
        console.error('Socket cart:update error:', err.message);
        socket.emit('error', { message: 'Failed to update cart quantity.' });
      }
    });

    // Collaborative Cart Event: Clear Cart
    socket.on('cart:clear', async ({ tableNum }) => {
      try {
        let cart = await Cart.findOne({ tableNum });
        if (cart) {
          cart.items = [];
          await cart.save();
        } else {
          cart = await Cart.create({ tableNum, items: [] });
        }
        io.to(`table_room_${tableNum}`).emit('cart:updated', cart);
      } catch (err) {
        console.error('Socket cart:clear error:', err.message);
      }
    });

    // Waiter Call assistance request
    socket.on('waiter:call', async ({ tableNum, serviceName }) => {
      try {
        const request = await WaiterRequest.create({
          tableNum: Number(tableNum),
          serviceName,
          status: 'pending'
        });

        // Notify staff room about the request
        io.to('staff_room').emit('waiter:request_new', request);

        // Acknowledge back to the table
        io.to(`table_room_${tableNum}`).emit('waiter:call_acknowledged', {
          serviceName,
          message: `🛎️ Request "${serviceName}" dispatched to Floor Host.`
        });
      } catch (err) {
        console.error('Socket waiter:call error:', err.message);
      }
    });

    // Handle disconnects
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      if (socket.tableNum) {
        const roomName = `table_room_${socket.tableNum}`;
        socket.to(roomName).emit('user:left', {
          name: socket.userName,
          message: `${socket.userName} disconnected.`
        });
      }
    });
  });
};

module.exports = socketHandler;

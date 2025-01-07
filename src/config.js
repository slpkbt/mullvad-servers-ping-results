module.exports = {
    CONCURRENT_PINGS: 15, 
    TABLE_STYLE: {
        chars: {
            'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
            'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
            'left': '║', 'left-mid': '╟', 'right': '║', 'right-mid': '╢',
            'mid': '─', 'mid-mid': '┼', 'middle': '│'
        },
        style: {
            head: ['cyan'],
            border: ['grey'],
        }
    },
    HTML_STYLES: `
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        table { border-collapse: collapse; width: 100%; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
        th { background: #2c3e50; color: white; padding: 12px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background: #f9f9f9; }
        .ping-good { color: #27ae60; }
        .ping-medium { color: #f39c12; }
        .ping-bad { color: #c0392b; }
    `
};

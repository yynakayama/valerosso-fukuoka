// middleware/auth.js - 認証関連のミドルウェア
const { User } = require('../models');

/**
 * 認証が必要なページへのアクセス制限
 * ログインしていない場合はログインページにリダイレクト
 */
const requireAuth = (req, res, next) => {
  // セッションにユーザーIDが存在しない場合
  if (!req.session.userId) {
    console.log('Unauthorized access attempt to:', req.originalUrl);
    return res.redirect('/admin/login');
  }
  
  // 認証済みの場合は次のミドルウェアに進む
  next();
};

/**
 * 未認証状態が必要なページへのアクセス制限
 * 既にログインしている場合は管理者パネルにリダイレクト
 */
const requireNoAuth = (req, res, next) => {
  // セッションにユーザーIDが存在する場合（既にログイン済み）
  if (req.session.userId) {
    console.log('Already logged in user attempting to access:', req.originalUrl);
    return res.redirect('/admin/panel');
  }
  
  // 未認証の場合は次のミドルウェアに進む
  next();
};

/**
 * 管理者権限が必要なページへのアクセス制限
 * 管理者でない場合は権限エラーを返す
 */
const requireAdmin = async (req, res, next) => {
  try {
    // まず認証されているかチェック
    if (!req.session.userId) {
      return res.status(401).send('認証が必要です');
    }
    
    // ユーザー情報を取得
    const user = await User.findByPk(req.session.userId, {
      attributes: ['id', 'username', 'role']
    });
    
    // ユーザーが存在しない場合
    if (!user) {
      console.log('User not found for session:', req.session.userId);
      return res.status(401).send('ユーザーが見つかりません');
    }
    
    // 管理者権限をチェック
    if (user.role !== 'admin') {
      console.log(`Access denied for user ${user.username} (role: ${user.role}) to:`, req.originalUrl);
      return res.status(403).send('このページにアクセスする権限がありません');
    }
    
    // リクエストオブジェクトにユーザー情報を追加
    req.user = user;
    
    // 管理者権限がある場合は次のミドルウェアに進む
    next();
  } catch (error) {
    console.error('Admin authorization error:', error);
    res.status(500).send('権限確認中にエラーが発生しました');
  }
};

/**
 * オプション：編集者以上の権限が必要なページへのアクセス制限
 * 編集者または管理者でない場合は権限エラーを返す
 */
const requireEditor = async (req, res, next) => {
  try {
    // まず認証されているかチェック
    if (!req.session.userId) {
      return res.status(401).send('認証が必要です');
    }
    
    // ユーザー情報を取得
    const user = await User.findByPk(req.session.userId, {
      attributes: ['id', 'username', 'role']
    });
    
    // ユーザーが存在しない場合
    if (!user) {
      console.log('User not found for session:', req.session.userId);
      return res.status(401).send('ユーザーが見つかりません');
    }
    
    // 編集者以上の権限をチェック
    if (user.role !== 'editor' && user.role !== 'admin') {
      console.log(`Access denied for user ${user.username} (role: ${user.role}) to:`, req.originalUrl);
      return res.status(403).send('このページにアクセスする権限がありません');
    }
    
    // リクエストオブジェクトにユーザー情報を追加
    req.user = user;
    
    // 編集者権限がある場合は次のミドルウェアに進む
    next();
  } catch (error) {
    console.error('Editor authorization error:', error);
    res.status(500).send('権限確認中にエラーが発生しました');
  }
};

/**
 * セッション情報をチェックして、レスポンスローカル変数にユーザー情報を設定
 * テンプレートでログイン状態やユーザー情報を使用できるようにする
 */
const setUserInfo = async (req, res, next) => {
  try {
    // セッションにユーザーIDが存在する場合
    if (req.session.userId) {
      // データベースからユーザー情報を取得
      const user = await User.findByPk(req.session.userId, {
        attributes: ['id', 'username', 'full_name', 'role']
      });
      
      if (user) {
        // レスポンスローカル変数に現在のユーザー情報を設定
        res.locals.currentUser = {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          role: user.role,
          isAdmin: user.role === 'admin',
          isEditor: user.role === 'editor' || user.role === 'admin'
        };
        
        // リクエストオブジェクトにもユーザー情報を追加（便利メソッド）
        req.currentUser = res.locals.currentUser;
      } else {
        // ユーザーが見つからない場合はセッションを無効化
        req.session.destroy();
        res.locals.currentUser = null;
      }
    } else {
      // ログインしていない場合
      res.locals.currentUser = null;
    }
    
    next();
  } catch (error) {
    console.error('User info setting error:', error);
    // エラーが発生してもアプリケーションを継続
    res.locals.currentUser = null;
    next();
  }
};

/**
 * APIリクエスト用の認証チェック
 * JSONレスポンスでエラーを返す
 */
const requireAuthAPI = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ 
      message: '認証が必要です',
      code: 'UNAUTHORIZED'
    });
  }
  next();
};

/**
 * API用管理者権限チェック
 * JSONレスポンスでエラーを返す
 */
const requireAdminAPI = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ 
        message: '認証が必要です',
        code: 'UNAUTHORIZED'
      });
    }
    
    const user = await User.findByPk(req.session.userId, {
      attributes: ['id', 'username', 'role']
    });
    
    if (!user) {
      return res.status(401).json({ 
        message: 'ユーザーが見つかりません',
        code: 'USER_NOT_FOUND'
      });
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        message: '管理者権限が必要です',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('API Admin authorization error:', error);
    res.status(500).json({ 
      message: '権限確認中にエラーが発生しました',
      code: 'AUTHORIZATION_ERROR'
    });
  }
};

// ログイン済みユーザーのみアクセス可能
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).json({
    success: false,
    message: '認証が必要です'
  });
};

// 管理者のみアクセス可能
const isAdmin = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        success: false,
        message: '認証が必要です'
      });
    }

    const user = await User.findByPk(req.session.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '管理者権限が必要です'
      });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({
      success: false,
      message: '認証チェック中にエラーが発生しました'
    });
  }
};

// 未ログインユーザーのみアクセス可能（ログインページなど）
const isNotAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.redirect('/admin/panel');
  }
  next();
};

module.exports = {
  requireAuth,        // 認証が必要なページ用
  requireNoAuth,      // 未認証状態が必要なページ用
  requireAdmin,       // 管理者権限が必要なページ用
  requireEditor,      // 編集者権限が必要なページ用
  setUserInfo,        // ユーザー情報をテンプレートに設定
  requireAuthAPI,     // API用認証チェック
  requireAdminAPI,    // API用管理者権限チェック
  isAuthenticated,
  isAdmin,
  isNotAuthenticated
};